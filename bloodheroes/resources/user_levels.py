from flask import Resource, reqparse,marshal_with
from flask_restful_swagger import swagger
from bloodheroes import mongo
from bloodheroes.schemes import UserLevels,UserLevelsList
from bloodheroes.helpers.decorators import required_auth, current_user
from bloodheroes.exceptions import UserLevelsNotFound

user_levels_parser = reqparse.RequestParser()
user_levels_parser.add_argument('level_name',type=str)
user_levels_parser.add_argument('score',type=int)
user_levels_parser.add_argument('level_pict',type=str)

class User_LevelsAPI(Resource):
    """docstring for User_LevelsAPI"""
    decorators = [required_auth]

    @marshal_with(UserLevels.resource_fields)
    def get(self, level_id=None):
        user_level = mongo.db.user_levels.find_one({'level_id': level_id})
        if user_level is None:
            raise UserLevelsNotFound(level_id=level_id)
        return user_level

    @marshal_with(UserLevels.resource_fields)
    def put(self, level_id=None):
        user_level = mongo.db.user_levels.find_one({'level_id': level_id})
        if user_level is None:
            raise UserLevelsNotFound(level_id=level_id)
        args = user_levels_parser.parse_args()
        level_name = args['level_name']
        score = args['score']

        prepared_data={
            'level_name': level_name,
            'score':score,
            'level_pict':level_pict
        }

        if level_name is None:
            prepared_data.pop('level_name')
        if score is None:
            prepared_data.pop('score')
        if level_pict is None:
            prepared_data.pop('level_pict')
        mongo.db.user_levels.update({'level_id': level_id}, {'$set': prepared_data})
        return 'no content', 204

    @marshal_with(UserLevels.resource_fields)
    def delete(self, level_id=None):
        user_level = mongo.db.users.find_one({'level_id': level_id})
        if user_level is None:
            raise UserLevelsNotFound
        mongo.db.user_levels.remove({'level_id': level_id})
        return 'no content', 204

class User_LevelsListAPI(Resource):
    """docstring for User_LevelsListAPI"""
    decorators = [required_auth]

    @marshal_with(UserLevelsList.resource_fields)
    def get(self):
        args = user_levels_parser.parse_args()
        user_levels_cursor = mongo.db.user_levels.find({})
        return {'user_levels': user_levels_cursor},200

    @marshal_with(UserLevelsList.resource_fields)
    def post(self):
        "list level"
        args = user_levels_parser.parse_args()
        level_name = args['level_name']
        score = args['score']

        user_levels_cursor = mongo.db.user_levels.find_one({})
        last_id = 0
        for user_level in user_levels_cursor:
            last_id = int(user_level['level_id'])
        prepared_data = {
            'level_id': last_id + 1,
            'level_name': level_name,
            'score': score,
            'level_pict': level_pict
        }
        mongo.db.user_levels.insert_one(prepared_data)
        return prepared_data, 200
