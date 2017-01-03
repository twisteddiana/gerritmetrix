import tornado.web
from tornado import gen

from gerritmetrix.components.gerritmetrixbucket import GerritMetrixBucket

class ChangesHandler(tornado.web.RequestHandler):
    @gen.coroutine
    def post(self):
        if self.request.body != b'':
            params = tornado.escape.json_decode(self.request.body)
        else:
            params = {}

        bucket = GerritMetrixBucket()
        changes = yield bucket.get_changes(params)

        self.write({"rows": changes})


class ChangeHandler(tornado.web.RequestHandler):
    @gen.coroutine
    def post(self):
        if self.request.body != b'':
            params = tornado.escape.json_decode(self.request.body)
        else:
            params = {}
        if 'change_number' not in params.keys():
            self.set_status(404)
            self.finish("")

        bucket = GerritMetrixBucket()
        change = yield bucket.get_doc(params['change_number'])
        if change is None:
            self.set_status(404)
            self.finish("")
        else:
            self.write(change)