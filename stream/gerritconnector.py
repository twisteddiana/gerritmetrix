import gerritlib.gerrit as gerrit
from gerritbucket import GerritBucket, GerritCiBucket
from settings import settings
from time import sleep, time
import datetime
from copy import deepcopy
import re
import uuid
import configparser

class GerritConnector:
    client = None
    executor = None
    bucket = None
    cibucket = None

    def connect(self):
        print("Connecting....")

        config = configparser.ConfigParser()
        config.read(settings['config_path'])

        self.bucket = GerritBucket()
        self.bucket.initialise()
        self.cibucket = GerritCiBucket();
        self.cibucket.initialise()
        self.client = gerrit.Gerrit(config['gerrit']['host'], config['gerrit']['username'],
                                    keyfile=config['gerrit']['key'])
        self.client.startWatching()

    def stream(self):
        print('Streaming')
        while True:
            event = self.client.getEvent()
            timestamp = time()
            add = False
            if event['type'] in ['comment-added', 'change-abandoned', 'change-merged', 'patchset-created', 'change-restored']:
                if event['type'] == 'comment-added':
                    if ('username' in event['author'].keys() and event['author']['username'] == 'jenkins') \
                            or ('name' in event['author'].keys() and event['author']['name'][-2:] == 'CI'):
                       add = True
                else:
                    add = True

            if add:
                print("%s @ %s - %s"%(datetime.datetime.fromtimestamp(timestamp).strftime('%Y-%m-%d %H:%M:%S'), event['type'], event))

                if event['type'] == 'patchset-created':
                    doc_id = event['change']['number']
                    try:
                        parent_doc = self.bucket.get_doc(doc_id)
                        parent_doc['patchSets'].append(event)
                        parent_doc['lastUpdate'] = event['eventCreatedOn']
                        parent_doc['status'] = event['change']['status']
                        self.bucket.bucket.upsert(doc_id, parent_doc)
                    except Exception:
                        clone = deepcopy(event)
                        event['lastUpdate'] = event['eventCreatedOn']
                        event['patchSets'] = [clone]
                        event['statuses'] = []
                        event['comments'] = []
                        event['status'] = clone['change']['status']
                        self.bucket.bucket.insert(doc_id, event)

                else:
                    search_doc_id = event['change']['number']
                    try:
                        parent_doc = self.bucket.get_doc(search_doc_id)
                        if event['type'] in ['change-merged', 'change-abandoned', 'change-restored']:
                            parent_doc['lastUpdate'] = event['eventCreatedOn']
                            parent_doc['status'] = event['change']['status']
                            parent_doc['statuses'].append(event)
                        else:
                            if event['type'] == 'comment-added':
                                parent_doc['comments'].append(event)
                        self.bucket.bucket.upsert(search_doc_id, parent_doc)

                        if event['type'] == 'comment-added':
                            try:
                                self.cibucket.bucket.upsert(
                                    event['author']['username'],
                                    {
                                        'type': 'author',
                                        'name': event['author']['name'],
                                        'username': event['author']['username']
                                    }
                                )
                            except Exception:
                                pass

                            new_doc = {
                                'type': 'comment-added',
                                'author': event['author']['username'],
                                'change': {
                                    'number': event['change']['number'],
                                    'patchSet': event['patchSet']['number'],
                                    'project': event['change']['project'],
                                    'createdOn': event['patchSet']['createdOn']
                                },
                                'eventCreatedOn': event['eventCreatedOn'],
                            }
                            if 'approvals' in event.keys():
                                new_doc['approvals'] = event['approvals']

                            message = event['comment'].split('\n')
                            if message[2] and re.match(r'^Build (.*)$', message[2]):
                                build_result = re.match(
                                    r'Build (?P<result>[a-zA-Z]+)(\s\((?P<pipeline>[a-zA-Z]+)\spipeline\))?',
                                    message[2])
                                new_doc['pipeline'] = build_result.groupdict()['pipeline']
                                new_doc['build_result'] = build_result.groupdict()['result']

                            for i in range(2, len(message)):
                                if not len(message[i]):
                                    continue
                                job_result = re.match(
                                    r'[-*]\s(?P<name>[-_a-zA-Z0-9\.]+)\s(?P<link>[-a-zA-Z0-9@:%_\+.~#?&//=]*)\s:\s(?P<result>[A-Za-z_]+)[\s]?(?P<extra>.*)?',
                                    message[i])

                                if job_result is None:
                                    continue

                                job_result = job_result.groupdict()
                                job_doc = deepcopy(new_doc)

                                try:
                                    self.cibucket.bucket.upsert(job_result['name'],
                                                                 {'type': 'job', 'author': event['author']['username'],
                                                                  'name': job_result['name']})
                                except Exception:
                                    pass

                                job_doc['job'] = job_result['name']
                                job_doc['result_text'] = job_result['result']
                                job_doc['extra'] = job_result['extra']
                                if job_result['result'].lower().find('succ') == 0:
                                    job_doc['result'] = 1
                                else:
                                    if job_result['result'].lower().find('abort') == 0:
                                        job_result['result'] = -1
                                    else:
                                        job_result['result'] = 0

                                key = '-'.join([event['change']['number'], str(uuid.uuid4())])
                                self.cibucket.bucket.upsert(key, job_doc)
                    except Exception:
                        pass
            else:
                print("SKIPPING %s @ %s - %s" % (datetime.datetime.fromtimestamp(timestamp).strftime('%Y-%m-%d %H:%M:%S'), event['type'], event))