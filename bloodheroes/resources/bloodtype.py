from flask_restful import Resource, reqparse,marshal_with
from flask_restful_swagger import swagger
from bloodheroes import mongo
from bloodheroes.schemes import BloodTypes,BloodTypeList
from bloodheroes.helpers.decorators import required_auth
from bloodheroes.exceptions import BloodNotFound, FieldRequired,InvalidFileType

blood_types_parser = reqparse.RequestParser()
blood_types_parser.add_argument('blood_name',type=str)
blood_types_parser.add_argument('rexus',type=int)

class BloodTypesAPI(Resource):
    """docstring for BloodTypeAPI"""

    decorators = [required_auth]

    @swagger.operation(
        notes="""Get blood type""",
        parameters=[
            {
                "name": "X-SESSION-ID",
                "description": "",
                "required": True,
                "allowMultiple": False,
                "dataType": "string",
                "paramType": "header"
            },
            {
                "name": "X-APP-TOKEN",
                "description": "",
                "required": True,
                "allowMultiple": False,
                "dataType": "string",
                "paramType": "header"
            }
        ],
        responseClass=BloodTypes.__name__,
        responseMessages=[
            {
                "code": 200,
                "message": "OK"
            },
            FieldRequired.to_swagger(),
        ]
    )

    @marshal_with(BloodTypes.resource_fields)
    def get(self, blood_id=None):
        blood_type = mongo.db.blood_types.find_one({'blood_id': blood_id})
        if blood_type is None:
            raise BloodNotFound(blood_id=blood_id)
        return blood_type


    @swagger.operation(
        notes="""Update blood type by id""",
        parameters=[
            {
                "name": "X-SESSION-ID",
                "description": "",
                "required": True,
                "allowMultiple": False,
                "dataType": "string",
                "paramType": "header"
            },
            {
                "name": "X-APP-TOKEN",
                "description": "",
                "required": True,
                "allowMultiple": False,
                "dataType": "string",
                "paramType": "header"
            },
            {
                "name": "blood-name",
                "description": "",
                "required": True,
                "allowMultiple": False,
                "dataType": BloodTypes.__name__,
                "paramType": "body"
            }
        ],
        responseClass=BloodTypes.__name__,
        responseMessages=[
            {
                "code": 200,
                "message": "OK"
            },
            BloodNotFound.to_swagger()
        ]
    )

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

    @swagger.operation(
        notes="""Delete blood type by id""",
        parameters=[
            {
                "name": "X-SESSION-ID",
                "description": "",
                "required": True,
                "allowMultiple": False,
                "dataType": "string",
                "paramType": "header"
            },
            {
                "name": "X-APP-TOKEN",
                "description": "",
                "required": True,
                "allowMultiple": False,
                "dataType": "string",
                "paramType": "header"
            }
        ],
        responseClass=BloodTypes.__name__,
        responseMessages=[
            {
                "code": 200,
                "message": "OK"
            },
            FieldRequired.to_swagger(),
        ]
    )
    @marshal_with(BloodTypes.resource_fields)
    def delete(self, blood_id=None):
        blood_type = mongo.db.users.find_one({'blood_id': blood_id})
        if blood_type is None:
            raise BloodNotFound
        mongo.db.users.remove({'blood_id': blood_id})
        return 'no content', 204

class BloodTypesListAPI(Resource):
    """docstring for BloodTypeListAPI"""

    decorators = [required_auth]

    @swagger.operation(
        notes="""Get list of blood types""",
        parameters=[
            {
                "name": "X-SESSION-ID",
                "description": "",
                "required": True,
                "allowMultiple": False,
                "dataType": "string",
                "paramType": "header"
            },
            {
                "name": "X-APP-TOKEN",
                "description": "",
                "required": True,
                "allowMultiple": False,
                "dataType": "string",
                "paramType": "header"
            },
            {
                "name": "blood_name",
                "description": "",
                "required": True,
                "allowMultiple": False,
                "dataType": "str",
                "paramType": "query"
            },
            {
                "name": "rexus",
                "description": "",
                "required": False,
                "allowMultiple": False,
                "dataType": "int",
                "paramType": "query"
            }
        ],
        responseClass=BloodTypeList.__name__,
        responseMessages=[
            {
                "code": 200,
                "message": "OK"
            },
            BloodNotFound.to_swagger()
        ]
    )

    @marshal_with(BloodTypeList.resource_fields)
    def get(self):
        args = blood_types_parser.parse_args()
        blood_cursor = mongo.db.blood_types.find({})
        return {'blood_types': blood_cursor},200


    @swagger.operation(
        notes="""Blood type list posting method""",
        parameters=[
            {
                "name": "blood-type",
                "description": "",
                "required": True,
                "allowMultiple": False,
                "dataType": BloodTypeList.__name__,
                "paramType": "body"
            },
            {
                "name": "X-APP-TOKEN",
                "description": "",
                "required": True,
                "allowMultiple": False,
                "dataType": "string",
                "paramType": "header"
            },
            {
                "name": "X-SESSION-ID",
                "description": "",
                "required": True,
                "allowMultiple": False,
                "dataType": "string",
                "paramType": "header"
            }
        ],
        responseClass=BloodTypeList.__name__,
        responseMessages=[
            {
                "code": 200,
                "message": "OK"
            },
            InvalidFileType.to_swagger()
        ]
    )
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
