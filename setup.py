from distutils.core import setup

setup(name='Gettrix',
      version='1.0',
      description='Gerrit CI metrics',
      author='Diana Barsan',
      author_email='twisteddiana@gmail.com',
      packages=['gerritmetrix', 'gerritmetrix.command', 'gerritmetrix.controllers'],
     )