import tornado.web
from tornado import gen
from gerritmetrix.components.gerritmetrixbucket import GerritMetrixBucket
from gerritmetrix.components.gerritcibucket import GerritCiBucket
from copy import deepcopy
import re
import traceback
import uuid


class ProjectsHandler(tornado.web.RequestHandler):
    @gen.coroutine
    def post(self):
        if self.request.body != b'':
            params = tornado.escape.json_decode(self.request.body)
        else:
            params = {}

        bucket = GerritMetrixBucket()
        projects = yield bucket.get_projects(params)

        self.write({"rows": projects})

    @gen.coroutine
    def explode(self):
        bucket = GerritMetrixBucket()
        bucket.initialise()

        change_list = yield bucket.bucket.n1qlQueryAll('select change.`number` from gerritmetrix where type = "patchset-created"')
        for number in change_list:
            number = number['number']
            document = yield bucket.get_doc(number)
            for comment in document['comments']:
                try:
                    new_doc = {
                        'type': 'comment-added',
                        'author': comment['author'],
                        'change': {
                            'number': number,
                            'patchSet': comment['patchSet']['number'],
                            'project': comment['change']['project'],
                        },
                        'eventCreatedOn': comment['eventCreatedOn'],
                    }
                    if 'approvals' in comment.keys():
                        new_doc['approvals'] = comment['approvals']

                    message = comment['comment'].split('\n')
                    if message[2] and re.match(r'^Build (.*)$', message[2]):
                        build_result = re.match(r'Build (?P<result>[a-zA-Z]+)(\s\((?P<pipeline>[a-zA-Z]+)\spipeline\))?', message[2])
                        new_doc['pipeline'] = build_result.groupdict()['pipeline']
                        new_doc['build_result'] = build_result.groupdict()['result']

                    for i in range(4, len(message)):
                        if not len(message[i]):
                            continue
                        job_result = re.match(r'[-*]\s(?P<name>[-_a-zA-Z0-9\.]+)\s(?P<link>[-a-zA-Z0-9@:%_\+.~#?&//=]*)\s:\s(?P<result>[A-Za-z]+)[\s]?(?P<extra>.*)?', message[i])
                        if job_result is None:
                            continue
                        job_result = job_result.groupdict()
                        job_doc = deepcopy(new_doc)
                        job_doc['job'] = {
                            'name': job_result['name'],
                            'link': job_result['link']
                        }
                        job_doc['result_text'] = job_result['result']
                        job_doc['extra'] = job_result['extra']
                        if job_result['result'].lower().find('succ') == 0:
                            job_doc['result'] = 1
                        else:
                            if job_result['result'].lower().find('abort') == 0:
                                job_result['result'] = -1
                            else:
                                job_result['result'] = 0

                        key = '-'.join([number, str(uuid.uuid4())])
                        yield bucket.bucket.upsert(key, job_doc)

                except Exception as exp:
                    print(comment)
                    print(str(exp))
                    traceback.print_tb(exp.__traceback__)
                    return
                    #print(job_doc)

    @gen.coroutine
    def fix(self):
        cibucket = GerritCiBucket()
        cibucket.initialise()
        metrixbucket = GerritMetrixBucket()
        metrixbucket.initialise()

        query = "select meta().id from gerritci where type = 'comment-added'"
        result = yield cibucket.bucket.n1qlQueryAll(query)
        list_changes = {}

        for row in result:
            doc_ci = yield cibucket.get_doc(row['id'])
            if not doc_ci['change']['number'] in list_changes.keys():
                doc_gerrit = yield metrixbucket.get_doc(doc_ci['change']['number'])
                list_changes[doc_ci['change']['number']] = doc_gerrit
            for patchset in doc_gerrit['patchSets']:
                if patchset['patchSet']['number'] == doc_ci['change']['patchSet']:
                    doc_ci['change']['createdOn'] = patchset['eventCreatedOn']
                    res = yield cibucket.bucket.upsert(row['id'], doc_ci)

        return res

    @gen.coroutine
    def get(self):
        pass


class ProjectHandler(tornado.web.RequestHandler):
    @gen.coroutine
    def post(self):
        if self.request.body != b'':
            params = tornado.escape.json_decode(self.request.body)
        else:
            params = {}

        bucket = GerritMetrixBucket()
        patches = yield bucket.get_project_changes(params)
        self.write({'rows': patches})


class ProjectChartHandler(tornado.web.RequestHandler):
    @gen.coroutine
    def post(self):
        if self.request.body != b'':
            params = tornado.escape.json_decode(self.request.body)
        else:
            params = {}

        cibucket = GerritCiBucket()
        bucket = GerritMetrixBucket()

        changes = yield cibucket.get_changes_interval(params['project'], params['start'], params['end'])
        if changes[0]:
            events = yield cibucket.get_check_result(params['project'], changes[0], params['author'], params['individual'])
        else:
            events = ([],[])

        if 'including_changes' in params.keys():
            self.write({'result': events[0], 'changes': changes[1], 'jobs': events[1]})
        else:
            self.write({'result': events[0], 'jobs': events[1]})


class ProjectAuthorHandler(tornado.web.RequestHandler):
    @gen.coroutine
    def post(self):
        if self.request.body != b'':
            params = tornado.escape.json_decode(self.request.body)
        else:
            params = {}

        cibucket = GerritCiBucket()

        results = yield cibucket.search_author(params['piece'], params['project'])
        self.write({'result': results})