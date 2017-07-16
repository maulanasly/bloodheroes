from flask import Resource, reqparse,marshal_with
from flask_restful_swagger import swagger
from bloodheroes import mongo
from bloodheroes.schemes import RequestBlood

req_donations_parser = reqparse.RequestParser()
req_donations_parser.add_argument('blood_name',type=str)
req_donations_parser.add_argument('resus')

class BloodTypeAPI(Resource):
    """docstring for BloodTypeAPI"""

        decorators = [required_auth]

        def get(self, blood_id=None):
            pass

        def put(self, blood_id=None):
            pass

        @marshal_with(BloodTypes.resource_fields)
        def delete(self, blood_id=None):
            if blood_id == 'self':
                blood_id = current_user['blood_id']
            user = mongo.db.users.find_one({'blood_id': blood_id})
            if user is None:
                raise UserNotFound
            mongo.db.users.remove({'blood_id': blood_id})
            return 'no content', 204

class BloodTypeListAPI(Resource):
    """docstring for BloodTypeListAPI"""

        #decorators = [required_auth]

        @swagger.operation(

        )


        def get(self, user_id=None):
            pass

        def post(self, user_id=None):
            pass
