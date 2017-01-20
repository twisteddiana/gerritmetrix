from settings import settings
from components.gerritcibucket import GerritCiBucket
from components.gerritmetrixbucket import GerritMetrixBucket

cibucket = GerritCiBucket()
cibucket.initialise()

metrixbucket = GerritMetrixBucket()
metrixbucket.initialise()

cibucket.bucket.n1qlQueryAll('CREATE PRIMARY INDEX `#primary` ON `{0}`'.format(cibucket.bucketname))
metrixbucket.bucket.n1qlQueryAll('CREATE PRIMARY INDEX `#primary` ON `{0}`'.format(metrixbucket.bucketname))

cibucket.bucket.n1qlQueryAll('CREATE INDEX `author` ON `{0}`(`name`,`username`) WHERE (`type` = "author")'
                             .format(cibucket.bucketname))
cibucket.bucket.n1qlQueryAll('CREATE INDEX `author_check` ON `{0}`((`change`.`project`),(`change`.`number`),'
                             '(`change`.`patchSet`),`eventCreatedOn`,`build_result`,(`change`.`createdOn`),`job`,`result_text`) '
                             'WHERE ((not (`author` = "jenkins")) and (`type` = "comment-added"))'.format(cibucket.bucketname))

cibucket.bucket.n1qlQueryAll('CREATE INDEX `author_exec` ON `{0}`((`change`.`project`),`author`) WHERE '
                             '(`type` = "comment-added")'.format(cibucket.bucketname))

metrixbucket.bucket.n1qlQueryAll('CREATE INDEX `change` ON `{0}`((`change`.`number`),`lastUpdate`,`status`,'
                                 '(`change`.`project`),(meta().`id`)) WHERE (`type` = "patchset-created")'
                                 .format(metrixbucket.bucketname))

metrixbucket.bucket.n1qlQueryAll('CREATE INDEX `change2` ON `{0}`((`change`.`number`),`eventCreatedOn`,'
                                 '(`change`.`project`)) WHERE (`type` = "patchset-created")'.format(metrixbucket.bucketname))

cibucket.bucket.n1qlQueryAll('CREATE INDEX `job` ON `{0}`(`name`,`author`) WHERE (`type` = "job")'.format(cibucket.bucketname))

metrixbucket.bucket.n1qlQueryAll('CREATE INDEX `project` ON `{0}`((`change`.`project`),(`change`.`number`),'
                                 '`lastUpdate`,`status`) WHERE (`type` = "patchset-created")'.format(metrixbucket.bucketname))

cibucket.bucket.n1qlQueryAll('CREATE INDEX `upstream_check` ON `gerritci`((`change`.`project`),(`change`.`number`),'
                             '(`change`.`patchSet`),`eventCreatedOn`,`build_result`,(`change`.`createdOn`),`job`,'
                             '`result_text`) WHERE (((`author` = "jenkins") and (`type` = "comment-added")) and '
                             '(`pipeline` = "check"))'.format(cibucket.bucketname))

bm = cibucket.bucket.bucket_manager()
design = {
    '_id': '_design/dev_test',
    'language': 'javascript',
    'views': {
        'test': {
            'map':
                """
                function (doc, meta) {
                    if (doc.type == "comment-added")
                        emit([doc.change.project, doc.change.createdOn], [doc.change.number, doc.change.patchSet])
                }
                """
        }
    }
}
bm.design_create('dev_test', design, use_devmode=True, syncwait=0)


bm = cibucket.bucket.bucket_manager()
design = {
    '_id': '_design/dev_test',
    'language': 'javascript',
    'views': {
        'test_2': {
            'map':
                """
                    function (doc, meta) {
                      if (doc.type == "comment-added") {
                        if ((doc.author == "jenkins" && doc.pipeline == "check") || doc.author != "jenkins")
                        emit([doc.change.project, doc.author, doc.change.createdOn], {
                            "job": doc.job,
                            "build_result": doc.build_result,
                            "result": doc.result_text,
                            "checkedOn": doc.eventCreatedOn,
                            "eventCreatedOn": doc.change.createdOn,
                            "patchSet": doc.change.patchSet,
                            "number": doc.change["number"]
                        })
                      }
                    }
                """
        }
    }
}
bm.design_create('dev_test', design, use_devmode=True, syncwait=0)