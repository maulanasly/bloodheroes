from setuptools import setup

setup(
    name='Bloodheroes',
    version='0.1-rc1',
    long_description=__doc__,
    author="Maulana Yusuf",
    author_email="im.idiiot@gmail.com",
    packages=['bloodheroes', 'bloodheroes.resources', 'bloodheroes.models', 'bloodheroes.helpers'],
    include_package_data=True,
    install_requires=[
        'flask>=0.10.1',
        'flask-restful',
        'flask-restful-swagger',
        'flask-redis',
        'Flask-PyMongo',
        'pymongo',
        'bcrypt'
    ],
    dependency_links=[
    ]
)
