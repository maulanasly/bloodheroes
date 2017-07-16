from flask_restful import Resource, reqparse,marshal_with
from flask_restful_swagger import swagger
from bloodheroes import mongo
from bloodheroes.schemes import BloodTypes,BloodTypeList
#from bloodheroes.helpers.decorators import required_auth
from bloodheroes.exceptions import BloodNotFound

blood_types_parser = reqparse.RequestParser()
blood_types_parser.add_argument('blood_name',type=str)
blood_types_parser.add_argument('rexus',type=int)

class BloodTypesAPI(Resource):
    """docstring for BloodTypeAPI"""

    #decorators = [required_auth]

    @marshal_with(BloodTypes.resource_fields)
    def get(self, blood_id=None):
        blood_type = mongo.db.blood_types.find_one({'blood_id': blood_id})
        if blood_type is None:
            raise BloodNotFound(blood_id=blood_id)
        return blood_type

    @marshal_with(BloodTypes.resource_fields)
    def put(self, blood_id=None):
        blood_type = mongo.db.blood_types.find_one({'blood_id': blood_id})
        if blood_type is None:
            raise BloodNotFound(blood_id=blood_id)
        args = blood_types_parser.parse_args()
        blood_name = args['blood_name']
        rexus = args['rexus']

        prepared_data={
            'blood_name': blood_name,
            'rexus':rexus
        }

        if blood_name is None:
            prepared_data.pop('blood_name')
        if rexus is None:
            prepared_data.pop('rexus')
        mongo.db.blood_types.update({'blood_id': blood_id}, {'$set': prepared_data})
        return 'no content', 204

    @marshal_with(BloodTypes.resource_fields)
    def delete(self, blood_id=None):
        blood_type = mongo.db.users.find_one({'blood_id': blood_id})
        if blood_type is None:
            raise BloodNotFound
        mongo.db.users.remove({'blood_id': blood_id})
        return 'no content', 204

class BloodTypesListAPI(Resource):
    """docstring for BloodTypeListAPI"""

    #decorators = [required_auth]

    @marshal_with(BloodTypeList.resource_fields)
    #@required_auth
    def get(self):
        args = blood_types_parser.parse_args()
        blood_cursor = mongo.db.blood_types.find({})
        return {'blood_types': blood_cursor},200

    @marshal_with(BloodTypeList.resource_fields)
    def post(self):
        args = blood_types_parser.parse_args()
        blood_name = args['blood_name']
        rexus = args['rexus']

        blood_types_cursor = mongo.db.blood_types.find_one({})
        last_id = 0
        for blood_type in blood_types_cursor:
            last_id = int(blood_type['blood_id'])
        prepared_data = {
            'blood_id': last_id + 1,
            'blood_name': blood_name,
            'rexus': rexus
        }
        mongo.db.blood_types.insert_one(prepared_data)
        return prepared_data, 200
