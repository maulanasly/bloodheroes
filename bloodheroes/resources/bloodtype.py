from flask import Resource, reqparse,marshal_with
from flask_restful_swagger import swagger
from bloodheroes import mongo
from bloodheroes.schemes import RequestBlood

blood_types_parser = reqparse.RequestParser()
blood_types_parser.add_argument('blood_name',type=str)
blood_types_parser.add_argument('resus',type=int)

class BloodTypesAPI(Resource):
    """docstring for BloodTypeAPI"""

        decorators = [required_auth]

        @marshal_with(BloodTypes.resource_fields)
        def get(self, blood_id=None):
            if  blood_id == 'self':
                blood_id == current_user['blood_id']
            blood_type = mongo.db.users.find_one({'blood_id': blood_id})
            if blood_type is None:
                raise BloodNotFound(blood_id=blood_id)
            return blood_type

        @marshal_with(BloodTypes.resource_fields)
        def put(self, blood_id=None):
            if  blood_id == 'self':
                blood_id == current_user['blood_id']
            blood_type = mongo.db.users.find_one({'blood_id': blood_id})
            if blood_type is None:
                raise BloodNotFound(blood_id=blood_id)
            args = blood_types_parser.parse_args()
            blood_name = args['blood_name']
            resus = args['resus']

            prepared_data={
                'blood_name': blood_name,
                'resus':resus
            }

            if blood_name is None:
                prepared_data.pop('blood_name')
            if resus is None:
                prepared_data.pop('resus')
            mongo.db.users.update({'blood_id': blood_id}, {'$set': prepared_data})
            return 'no content', 204

        @marshal_with(BloodTypes.resource_fields)
        def delete(self, blood_id=None):
            if blood_id == 'self':
                blood_id = current_user['blood_id']
            blood_type = mongo.db.users.find_one({'blood_id': blood_id})
            if blood_type is None:
                raise BloodNotFound
            mongo.db.users.remove({'blood_id': blood_id})
            return 'no content', 204

class BloodTypesListAPI(Resource):
    """docstring for BloodTypeListAPI"""

        #decorators = [required_auth]

        @swagger.operation(

        )


        def get(self):
            pass

        def post(self):
            pass
