import tornado.ioloop
import tornado.web
from tornado import gen
from settings import settings
import tornado.platform.twisted
import configparser
tornado.platform.twisted.install()
from controllers.projects import ProjectsHandler, ProjectHandler, ProjectChartHandler, ProjectAuthorHandler
from controllers.changes import ChangesHandler, ChangeHandler
from controllers.cis import CiHandler, CisHandler

class MainHandler(tornado.web.RequestHandler):
    @gen.coroutine
    def get(self):
        self.render("index.html")


def make_app():
    return tornado.web.Application([
        (r"/", MainHandler),
        (r"/projects", ProjectsHandler),
        (r"/project", ProjectHandler),
        (r"/project_chart", ProjectChartHandler),
        (r"/authors", ProjectAuthorHandler),
        (r"/changes", ChangesHandler),
        (r"/change", ChangeHandler),
        (r"/cis", CisHandler),
        (r"/ci", CiHandler)
    ], **settings)

if __name__ == "__main__":
    config = configparser.ConfigParser()
    config.read(settings['config_path'])

    app = make_app()
    app.listen(config['general']['port'])
    tornado.ioloop.IOLoop.current().start()