from txcouchbase.bucket import Bucket
from settings import settings
from tornado import gen
import configparser


class GerritMetrixBucket:
    bucketname = ''
    password = ''
    server = ''
    bucket = None

    def initialise(self):
        if self.bucketname == '':
            config = configparser.ConfigParser()
            config.read(settings['config_path'])

            self.bucketname = config['metrix-bucket']['name']
            self.password = config['metrix-bucket']['password']
            self.server = config['metrix-bucket']['server']

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
    def get_projects(self, query):
        if self.bucket is None:
            self.initialise()

        search_query = 'select a.change.project, max(a.lastUpdate) as lastUpdate, max(a.change.`number`) as `number`, ARRAY_AGG(a.status) as status'
        search_query = ' '.join([search_query, 'from {0} as a'.format(self.bucketname)])
        if 'search' in query.keys() and query['search']:
            search_query = ' '.join([search_query,
                                     'where a.change.project like "%{1}%"'.format(self.bucketname, query['search'])])
        else:
            search_query = ' '.join([search_query, 'where a.change.project'])
        search_query = ' '.join([search_query,
                                 'and a.lastUpdate and a.type = "patchset-created"'])
        search_query = ' '.join([search_query, 'group by a.change.project order by a.change.project asc'])
        search_query = ' '.join([search_query, 'limit {0} offset {1}'.format(query['limit'], query['skip'])])

        result = yield self.bucket.n1qlQueryAll(query=search_query)
        result = yield self.process_rows(result)
        return result

    @gen.coroutine
    def process_rows(self, rows, get_doc=False):
        result = []
        for row in rows:
            if get_doc:
                doc = yield self.get_doc(row['number'])
                row['doc'] = doc
            result.append(row)
        return result

    @gen.coroutine
    def get_project_changes(self, params):
        if self.bucket is None:
            self.initialise()

        query = 'select a.change.`number`'
        query = ' '.join([query, 'from {0} a '.format(self.bucketname)])
        query = ' '.join([query, 'where a.change.project = "{0}"'.format(params['project_name'])])
        query = ' '.join([query, 'and a.type = "patchset-created" order by a.lastUpdate desc'.format(self.bucketname)])
        query = ' '.join([query, 'limit {0} offset {1}'.format(params['limit'], params['skip'])])

        result = yield self.bucket.n1qlQueryAll(query=query)
        result = yield self.process_change_rows(result)

        return result

    @gen.coroutine
    def process_change_rows(self, rows):
        result = []
        for row in rows:
            doc = yield self.get_doc(row['number'])
            row['project'] = doc['change']['project']
            row['commitMessage'] = doc['change']['commitMessage']
            row['status'] = doc['status']
            row['owner'] = doc['change']['owner']
            row['lastUpdate'] = doc['lastUpdate']
            result.append(row)
        return result

    @gen.coroutine
    def get_changes(self, params):
        if self.bucket is None:
            self.initialise()

        query = 'select a.change.`number`'
        query = ' '.join([query, 'from {0} a where a.lastUpdate'.format(self.bucketname)])
        if 'project' in params['search'].keys() and params['search']['project']:
            query = ' '.join([query, 'and a.change.project like "%{0}%"'.format(params['search']['project'])])
        else:
            query = ' '.join([query, 'and a.change.project'])
        if 'status' in params['search'].keys() and params['search']['status'] and "ALL" not in params['search']['status']:
            query = ' '.join([query, 'and ('])
            status_list = []
            for status in params['search']['status']:
                status_list.append('a.status = "{0}"'.format(status))
            status_query = ' or '.join(status_list)
            query = ' '.join([query, status_query, ')'])

        query = ' '.join([query, 'and a.type = "patchset-created" order by a.lastUpdate desc'.format(self.bucketname)])
        query = ' '.join([query, 'limit {0} offset {1}'.format(params['limit'], params['skip'])])

        result = yield self.bucket.n1qlQueryAll(query=query)
        result = yield self.process_change_rows(result)

        return result

    @gen.coroutine
    def get_changes_interval(self, project, start, end):
        if self.bucket is None:
            self.initialise()

        query = 'select change.`number` from {0} where change.project = "{1}" ' \
                'and change.`number` and lastUpdate >= {2} and lastUpdate <= {3} ' \
                'and type = "patchset-created"'.format(self. bucketname, project, start, end)

        result = yield self.bucket.n1qlQueryAll(query=query)
        result = yield self.process_rows(result)

        return result