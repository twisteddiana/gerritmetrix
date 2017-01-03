import tornado.web
from tornado import gen
from gerritmetrix.components.gerritmetrixbucket import GerritMetrixBucket
from gerritmetrix.components.gerritcibucket import GerritCiBucket
import uuid

class CisHandler(tornado.web.RequestHandler):
    @gen.coroutine
    def post(self):
        if self.request.body != b'':
            params = tornado.escape.json_decode(self.request.body)
        else:
            params = {}

        bucket = GerritCiBucket()
        authors = yield bucket.get_cis(params)

        self.write({"rows": authors})

    @gen.coroutine
    def get(self):
        pass
        # gerritmetrix = GerritMetrixBucket()
        # gerritmetrix.initialise()
        #
        # gerritci = GerritCiBucket()
        # gerritci.initialise()
        #
        # final = None
        #
        # results = yield gerritmetrix.bucket.n1qlQueryAll('select meta().id from gerritmetrix where type = "comment-added"')
        # for meta_id in results:
        #     row = yield gerritmetrix.get_doc(meta_id['id'])
        #     try:
        #         yield gerritci.bucket.upsert(row['author']['username'], {'type': 'author', 'name': row['author']['name'], 'username': row['author']['username']})
        #     except Exception:
        #         pass
        #
        #     try:
        #         yield gerritci.bucket.upsert(row['job']['name'], {'type': 'job', 'author': row['author']['username'], 'name': row['job']['name']})
        #     except Exception:
        #         pass
        #
        #     row['author'] = row['author']['username']
        #     row['job'] = row['job']['name']
        #
        #     key = '-'.join([row['change']['number'], str(uuid.uuid4())])
        #     final = yield gerritci.bucket.upsert(key, row)
        #
        # print(final)



class CiHandler(tornado.web.RequestHandler):
    @gen.coroutine
    def post(self):
        if self.request.body != b'':
            params = tornado.escape.json_decode(self.request.body)
        else:
            params = {}

        bucket = GerritCiBucket()
        jobs = yield bucket.get_jobs(params)

        self.write({"rows": jobs})