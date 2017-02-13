from txcouchbase.bucket import Bucket
from settings import settings
from tornado import gen
import configparser

class GerritCiBucket:
    bucketname = ''
    password = ''
    server = ''
    bucket = None

    def initialise(self):
        if self.bucketname == '':
            config = configparser.ConfigParser()
            config.read(settings['config_path'])

            self.bucketname = config['ci-bucket']['name']
            self.password = config['ci-bucket']['password']
            self.server = config['ci-bucket']['server']

        self.bucket = Bucket(''.join([self.server, self.bucketname]), password=self.password)
        return self.bucket

    @gen.coroutine
    def get_doc(self, docid):
        if self.bucket is None:
            self.initialise()
        try:
            doc = yield self.bucket.get(docid)
            return doc.value
        except Exception:
            return None

    @gen.coroutine
    def get_cis(self, params):
        if self.bucket is None:
            self.initialise()

        query = 'select a.name, a.username, count(b.name) as counter from {0} b left join {0} a on keys b.author'.format(self.bucketname)
        query = ' '.join([query, 'where a.name and b.name'])
        if 'search' in params.keys() and params['search']:
            query = ' '.join([query, 'and (a.name like "%{0}%" or a.username like "%{0}%")'.format(params['search'])])
        query = ' '.join([query, 'and a.type = "author" and b.type = "job"'])
        query = ' '.join([query, 'group by a.username, a.name order by a.name'])
        query = ' '.join([query, 'limit {0} offset {1}'.format(params['limit'], params['skip'])])

        result = yield self.bucket.n1qlQueryAll(query=query)
        result = yield self.process_rows(result)
        return result

    @gen.coroutine
    def get_jobs(self, params):
        if self.bucket is None:
            self.initialise()

        query = 'select name from {0} where type="job" and name and author = "{1}"'.format(self.bucketname, params['name'])
        if 'search' in params.keys() and params['search']:
            query = ' '.join([query, 'and name like "%{0}%"'.format(params['search'])])
        query = ' '.join([query, 'limit {0} offset {1}'.format(params['limit'], params['skip'])])

        result = yield self.bucket.n1qlQueryAll(query=query)
        result = yield self.process_rows(result)
        return result

    @gen.coroutine
    def process_rows(self, rows, get_doc=False):
        result = []
        for row in rows:
            if get_doc:
                doc = yield self.get_doc(row['id'])
                row['doc'] = doc
            result.append(row)
        return result

    @gen.coroutine
    def get_events(self, params):
        if self.bucket is None:
            self.initialise()

        query = 'select meta().id, change.`number`, change.`patchSet` from {0} where type="comment-added" ' \
                'and job = "{1}" and eventCreatedOn >= {2} and eventCreatedOn <= {3}'\
            .format(self.bucketname, params['job'], params['start'], params['end'])

        result = yield self.bucket.n1qlQueryAll(query=query)
        result = yield self.process_rows(result, False)

        return result

    @gen.coroutine
    def get_changes_interval(self, project, start, end):
        if self.bucket is None:
            self.initialise()
        result = yield self.bucket.queryAll("dev_test", "test", endkey=[project, start],
                                              startkey=[project, end], full_set=True, descending=True)

        changes = {}
        raw_result = []
        if result:
            for row in result:
                if row.value not in raw_result:
                    raw_result.append(row.value)
                if row.value[0] not in changes.keys():
                    changes[row.value[0]] = []
                if row.value[1] not in changes[row.value[0]]:
                    changes[row.value[0]].append(row.value[1])

        return changes, raw_result

    @gen.coroutine
    def get_check_results_view(self, project, author, start, end):
        if self.bucket is None:
            self.initialise()

        result = yield self.bucket.queryAll("dev_test", "test_2", endkey=[project, author, start],
                                            startkey=[project, author,end], full_set=True, descending=True)

        final_result = []
        jobs = []
        if result:
            for row in result:
                final_result.append(row.value)
                if row.value['job'] not in jobs:
                    jobs.append(row.value['job'])

        return final_result, jobs

    @gen.coroutine
    def get_check_result(self, project, changes, author, individual=0, start=0):
        if self.bucket is None:
            self.initialise()

        if not individual:
            query = 'select max(build_result) as result, max(change.createdOn) as eventCreatedOn, eventCreatedOn as checkedOn, change.patchSet, change.`number`, ' \
                    'count(build_result) as counter from {0} where'.format(self.bucketname)
            query = ' '.join([query, 'type = "comment-added" and change.project = "{0}"'.format(project)])
            if author == 'jenkins':
                query = ' '.join([query, 'and author = "jenkins" and pipeline = "check"'])
            else:
                query = ' '.join([query, 'and author = "{0}"'.format(author)])

            changes_part = [];
            for change, patchSets in changes.items():
                change_part = 'change.`number` = "{0}"'.format(change)
                patchset_part = []
                for patchSet in patchSets:
                    patchset_part.append('change.`patchSet` = "{0}"'.format(patchSet))
                changes_part.append(change_part)
            query = ' '.join([query, 'and ((', ') or ('.join(changes_part), '))'])
            query = ' '.join([query, 'group by change.`number`, change.patchSet, eventCreatedOn order by eventCreatedOn'])
        else:
            # get jobs
            query = 'select job, build_result, result_text as result,change.patchSet, change.`number`, eventCreatedOn as checkedOn, ' \
                    'change.createdOn as eventCreatedOn, 1 as counter from {0} where'.format(self.bucketname)
            query = ' '.join([query, 'type = "comment-added" and change.project = "{0}"'.format(project)])
            if author == 'jenkins':
                query = ' '.join([query, 'and author = "jenkins" and pipeline = "check"'])
            else:
                query = ' '.join([query, 'and author = "{0}" and change.patchSet'.format(author)])

            query = ' '.join([query, 'and eventCreatedOn > {0}'.format(start)])

            changes_part = [];
            query = ' '.join([query, 'and change.`number` in '])
            for change, patchSets in changes.items():
                changes_part.append('"{0}"'.format(change))
            query = ' '.join([query, '[', ','.join(changes_part), ']'])
            query = ' '.join([query, 'order by checkedOn'])

        print(query)
        result = yield self.bucket.n1qlQueryAll(query=query)
        result = yield self.process_rows(result, False)

        final_result = []
        jobs = []
        for row in result:
            if row['patchSet'] in changes[row['number']]:
                final_result.append(row)
                if row['job'] not in jobs:
                    jobs.append(row['job'])

        return (final_result, jobs)

    @gen.coroutine
    def search_author(self, piece, project):
        if self.bucket is None:
            self.initialise()

        query = 'select name, username from {0} where type = "author" and name and username'.format(self.bucketname)
        query = ' '.join([query, 'and (lower(name) like "%{0}%" or lower(username) like "%{0}%")'.format(piece.lower())])
        query = ' '.join([query, 'order by name'])

        result = yield self.bucket.n1qlQueryAll(query=query)
        result = yield self.process_rows(result, False)

        final_result = []
        for row in result:
            query = 'select author from {0} where type = "comment-added" '.format(self.bucketname)
            query = ' '.join([query, 'and change.project = "{0}" and author = "{1}" limit 1'.format(project, row['username'])])

            res = yield self.bucket.n1qlQueryAll(query=query)
            exists = False
            for r in res:
                exists = True
            if exists:
                final_result.append(row)

        return final_result

    @gen.coroutine
    def get_change_result(self, project, author, change):
        if self.bucket is None:
            self.initialise()

        result = yield self.bucket.queryAll("dev_test", "test_3", key=[project, author, change], full_set=True)
        final_result = []
        jobs = []
        if result:
            for row in result:
                final_result.append(row.value)
                if row.value['job'] not in jobs:
                    jobs.append(row.value['job'])

        return final_result, jobs

    @gen.coroutine
    def prepare_results(self, events, changes_list):
        final_results = {}
        for author, list in events.items():
            final_results[author] = {}
            final_results[author][author] = {}
            for job in list[1]:
                final_results[author][job] = {}
                for change in changes_list:
                    final_results[author][job]['_'.join([change[0], change[1]])] = []
            for change in changes_list:
                final_results[author][author]['_'.join([change[0], change[1]])] = []

            for result in list[0]:
                change_key = '_'.join([result['number'], result['patchSet']])
                final_results[author][result['job']][change_key].append(result)

            for change in changes_list:
                change_key = '_'.join([change[0], change[1]])
                for job in list[1]:
                    if len(final_results[author][job][change_key]):
                        final_results[author][author][change_key] = final_results[author][job][change_key]
                        break

        return final_results
