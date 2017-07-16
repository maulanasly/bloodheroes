from flask import Resource, reqparse,marshal_with
from flask_restful_swagger import swagger
from bloodheroes import mongo
from bloodheroes.schemes import UserLevels,UserLevelsList
from bloodheroes.helpers.decorators import required_auth, current_user

user_levels_parser = reqparse.RequestParser()
user_levels_parser.add_argument('level_name',type=str)
user_levels_parser.add_argument('score',type=int)
user_levels_parser.add_argument('user_id',type=int)

class User_LevelsAPI(Resource):
    """docstring for User_LevelsAPI"""
    decorators = [required_auth]

    def get(self, level_id=None):
        pass

    def put(self, level_id=None):
        pass

    def delete(self, level_id=None):
        pass

class User_LevelsListAPI(Resource):
    """docstring for User_LevelsListAPI"""
    decorators = [required_auth]

    def get(self):
        pass

    def post(self):
        pass
