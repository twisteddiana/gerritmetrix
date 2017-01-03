from couchbase.bucket import Bucket
from settings import settings
import configparser

class GerritBucket:
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

    def put(self, event):
        result = self.bucket.upsert(event['change']['number'], event)
        return result

    def get_doc(self, docid):
        if self.bucket is None:
            self.initialise()
        doc = self.bucket.get(docid)
        return doc.value

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

    def put(self, event):
        result = self.bucket.upsert(event['change']['number'], event)
        return result

    def get_doc(self, docid):
        if self.bucket is None:
            self.initialise()
        doc = self.bucket.get(docid)
        return doc.value
