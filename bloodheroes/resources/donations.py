from flask_restful import Resource, reqparse, marshal_with
from flask_restful_swagger import swagger
from bloodheroes import mongo
from bloodheroes.schemes import RequestDonations
from bloodheroes.helpers.decorators import required_auth, current_user
from bloodheroes.helpers.utilities import to_timestamp
from bloodheroes.exceptions import InvalidFileType, BloodNotFound

from datetime import datetime

req_donations_parser = reqparse.RequestParser()
req_donations_parser.add_argument('blood_type')
req_donations_parser.add_argument('notes')


class RequestDonationAPI(Resource):
    """docstring for UserAPI"""
    decorators = [required_auth]

    def get(self, user_id=None):
        pass

    def put(self, user_id=None):
        pass

    def delete(self, user_id=None):
        pass


class RequestDonationListAPI(Resource):
    """docstring for UserAPI"""
    decorators = [required_auth]

    def get(self):
        pass

    @swagger.operation(
        notes="""User authentication method""",
        parameters=[
            {
                "name": "blood",
                "description": "",
                "required": True,
                "allowMultiple": False,
                "dataType": RequestDonations.__name__,
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
        responseClass=RequestDonations.__name__,
        responseMessages=[
            {
                "code": 200,
                "message": "OK"
            },
            InvalidFileType.to_swagger()
        ]
    )
    @marshal_with(RequestDonations.resource_fields)
    def post(self):
        "request donations"
        user_id = current_user['user_id']
        args = req_donations_parser.parse_args()
        blood_type = args['blood_type']
        notes = args['notes']
        blood = mongo.db.blood_types.find_one({'blood_name': blood_type})
        if blood is None:
            raise BloodNotFound
        donation = mongo.db.donations.find_one({})
        last_id = 0
        if donation is not None:
            last_id = donation['request_id']
        prepared_data = {
            'request_id': int(last_id) + 1,
            'user_id': user_id,
            'notes': notes,
            'blood_id': blood['blood_id'],
            'request_date': to_timestamp(datetime.now()),
            'donation_date': None,
            'status': 0
        }
        mongo.db.donations.insert_one(prepared_data)
        return prepared_data, 200
