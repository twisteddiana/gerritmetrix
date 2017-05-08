import tornado.ioloop
import tornado.web
from tornado import gen
from settings_react import settings
import tornado.platform.twisted
import configparser
tornado.platform.twisted.install()
from controllers.projects import ProjectsHandler, ProjectHandler, ProjectChartHandler, ProjectAuthorHandler
from controllers.changes import ChangesHandler, ChangeHandler, ChangeChartHandler
from controllers.cis import CiHandler, CisHandler

class MainHandler(tornado.web.RequestHandler):
    @gen.coroutine
    def get(self):
        self.render("index.ejs")


def make_app():
    return tornado.web.Application([
        (r"/api/projects", ProjectsHandler),
        (r"/api/project", ProjectHandler),
        (r"/api/project_chart", ProjectChartHandler),
        (r"/api/authors", ProjectAuthorHandler),
        (r"/api/changes", ChangesHandler),
        (r"/api/change", ChangeHandler),
        (r"/api/change_chart", ChangeChartHandler),
        (r"/api/cis", CisHandler),
        (r"/api/ci", CiHandler),
        (r"/.*", MainHandler),
    ], **settings)

if __name__ == "__main__":
    config = configparser.ConfigParser()
    config.read(settings['config_path'])

    app = make_app()
    app.listen(8880)
    #tornado.ioloop.IOLoop.current().start()
    try:
        tornado.ioloop.IOLoop.instance().start()
    except KeyboardInterrupt:
        tornado.ioloop.IOLoop.instance().stop()