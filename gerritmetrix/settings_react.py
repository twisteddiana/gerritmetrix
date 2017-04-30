import os

settings = {
    "template_path": os.path.join(os.path.dirname(os.path.dirname(__file__)), "static_react", "src", "views"),
    "static_path": os.path.join(os.path.dirname(os.path.dirname(__file__)), "static_react", "src", "static"),
    "config_path": os.path.join(os.path.dirname(os.path.dirname(__file__)), "config.ini"),
    "debug" : True
}