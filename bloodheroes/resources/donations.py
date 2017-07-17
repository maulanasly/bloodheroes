from flask_restful import Resource, reqparse, marshal_with
from flask_restful_swagger import swagger
from bloodheroes import mongo
from bloodheroes.schemes import RequestDonations, RequestDonationsList
from bloodheroes.helpers.decorators import required_auth, current_user
from bloodheroes.helpers.utilities import to_timestamp
from bloodheroes.exceptions import InvalidFileType, FieldRequired, RequisiteAlreadySatisfied

from datetime import datetime

req_donations_parser = reqparse.RequestParser()
req_donations_parser.add_argument('blood_type', type=str, required=True)
req_donations_parser.add_argument('notes', type=str)
req_donations_parser.add_argument('requisite_number', type=int, required=True)

get_donations_parser = reqparse.RequestParser()
get_donations_parser.add_argument('user_id', type=int)
get_donations_parser.add_argument('blood_type', type=str)
get_donations_parser.add_argument('status', type=int)
get_donations_parser.add_argument('giver', type=int, default=0)


class RequestDonationAPI(Resource):
    """docstring for UserAPI"""
    decorators = [required_auth]

    @swagger.operation(
        notes="""Get donations by id""",
        parameters=[
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
    def get(self, donation_id=None):
        'get donation by id'
        donation = mongo.db.donations.find_one({'request_id': donation_id})
        blood = mongo.db.blood_types.find_one({'blood_name': int(donation['blood_id'])})
        blood_name = None if blood is None else blood['blood_name']
        user = mongo.db.users.find_one({'user_id': donation['target_id']})
        donation_view = {
            'donation_id': donation['request_id'],
            'request_date': donation['request_date'],
            'blood_type': blood_name,
            'notes': donation['notes'],
            'user': {
                'firstname': user['firstname'],
                'lastname': user['lastname'],
                'contact': user['contact'],
                'email': user['email'],
            }
        }
        return donation_view, 200

    @swagger.operation(
        notes="""Update donation / accept donation request""",
        parameters=[
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
            RequisiteAlreadySatisfied.to_swagger()
        ]
    )
    @marshal_with(RequestDonations.resource_fields)
    def put(self, donation_id=None):
        "accept donation"
        donation = mongo.db.donations.find_one({'request_id': donation_id})
        req_donation = mongo.db.donations.find({'user_id': donation['user_id']}, {'$or': [{'status': 1}, {'status': 3}]})
        if req_donation.count() <= int(donation['requisite_number']):
            raise RequisiteAlreadySatisfied(requisite_number=donation['requisite_number'])
        mongo.db.donations.update({'request_id': donation_id}, {'$set': {'status': 1}})
        # user = mongo.db.users.find_one({'user_id': donation['target_id']})
        return 'no content', 204

    @swagger.operation(
        notes="""Decline donation request""",
        parameters=[
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
    def delete(self, donation_id=None):
        "decline donation"
        donation = mongo.db.donations.find_one({'request_id': donation_id})
        if donation is None:
            raise InvalidFileType
        mongo.db.donations.update({'request_id': donation_id}, {'$set': {'status': 2}})
        # user = mongo.db.users.find_one({'user_id': donation['target_id']})
        return 'no content', 204


class RequestDonationListAPI(Resource):
    """docstring for UserAPI"""
    decorators = [required_auth]

    @swagger.operation(
        notes="""Get donations history""",
        parameters=[
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
            },
            {
                "name": "blood_type",
                "description": "",
                "required": False,
                "allowMultiple": False,
                "dataType": "str",
                "paramType": "query"
            },
            {
                "name": "status",
                "description": "",
                "required": False,
                "allowMultiple": False,
                "dataType": "int",
                "paramType": "query"
            },
            {
                "name": "giver",
                "description": "",
                "required": False,
                "allowMultiple": False,
                "dataType": "int",
                "paramType": "query"
            },
        ],
        responseClass=RequestDonationsList.__name__,
        responseMessages=[
            {
                "code": 200,
                "message": "OK"
            },
            InvalidFileType.to_swagger()
        ]
    )
    @marshal_with(RequestDonationsList.resource_fields)
    def get(self):
        'donation list'
        args = get_donations_parser.parse_args()
        user_id = args['user_id']
        blood_type = args['blood_type']
        status = args['status']
        giver = args['giver']
        if user_id is None:
            user_id = current_user['user_id']
        blood = mongo.db.blood_types.find_one({'blood_name': blood_type})
        blood_id = None if blood is None else blood['blood_id']
        filters = {}
        if user_id:
            if giver == 0:
                filters['user_id'] = user_id
            else:
                filters['target_id'] = user_id
        if blood_id:
            filters['blood_id'] = blood_id
        if status:
            filters['status'] = status
        donation_cursor = mongo.db.donations.find(filters)
        donation_view = []
        requisite_number = 0
        for row in donation_cursor:
            blood = mongo.db.blood_types.find_one({'blood_name': int(row['blood_id'])})
            blood_name = None if blood is None else blood['blood_name']
            user = mongo.db.users.find_one({'user_id': row['target_id'] if giver == 0 else row['user_id']})
            requisite_number = row['requisite_number']
            donation = {
                'donation_id': row['request_id'],
                'request_date': row['request_date'],
                'blood_type': blood_name,
                'notes': row['notes'],
                'user': {
                    'firstname': user['firstname'],
                    'lastname': user['lastname'],
                    'contact': user['contact'],
                    'email': user['email'],
                }
            }
            donation_view.append(donation)
        return {'donations': donation_view, 'count': donation_cursor.count(), 'requisite_number': requisite_number}, 200

    @swagger.operation(
        notes="""Request for blood donations""",
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
        requisite_number = args['requisite_number']
        if blood_type is None:
            raise FieldRequired(required_field='blood_type')
        if requisite_number is None:
            raise FieldRequired(required_field='requisite_number')
        blood = mongo.db.blood_types.find_one({'blood_name': blood_type})
        blood_id = None if blood is None else blood['blood_id']
        users = mongo.db.users.find({'blood_id': blood_id, 'status': 1})
        for user in users:
            if user_id != user['user_id']:
                last_id = self.get_last_id()
                prepared_data = {
                    'request_id': last_id + 1,
                    'user_id': user_id,
                    'target_id': user['user_id'],
                    'notes': notes,
                    'blood_id': blood_id,
                    'request_date': to_timestamp(datetime.now()),
                    'donation_date': None,
                    'status': 0,
                    'requisite_number': requisite_number
                }
                mongo.db.donations.insert_one(prepared_data)
        return 'OK', 200

    def get_last_id(self):
        donation_cursor = mongo.db.donations.find({}).sort([('request_id', -1)]).limit(1)
        last_id = 0
        if donation_cursor:
            for row in donation_cursor:
                last_id = int(row['request_id'])
        return last_id


class DonationAccomplishment(Resource):
    """docstring for Donationaccomplishment"""
    decorators = [required_auth]

    @swagger.operation(
        notes="""Update donation / accomplishment donation request""",
        parameters=[
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
            RequisiteAlreadySatisfied.to_swagger()
        ]
    )
    @marshal_with(RequestDonations.resource_fields)
    def put(self, donation_id=None):
        "finish donation"
        mongo.db.donations.update({'request_id': donation_id}, {'$set': {'status': 3}})
        donation = mongo.db.donations.find({'target_id': current_user['user_id'], 'status': 3})
        donation_count = 0
        if donation is None:
            donation_count = donation.count()
        user_level = mongo.db.user_level.find({'score': {'$gt': donation_count}}).sort([('score', 1)]).limit(1)
        level_id = 1
        for level in user_level:
            level_id = level['level_id']
            break
        mongo.db.users.update({'user_id': current_user['user_id']}, {'$set': {'level_id': level_id}})
        # user = mongo.db.users.find_one({'user_id': donation['target_id']})
        return 'no content', 204


class DonationHistory(Resource):
    """docstring for UserAPI"""
    decorators = [required_auth]

    @swagger.operation(
        notes="""Get donations history""",
        parameters=[
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
            },
            {
                "name": "blood_type",
                "description": "",
                "required": False,
                "allowMultiple": False,
                "dataType": "str",
                "paramType": "query"
            },
            {
                "name": "status",
                "description": "",
                "required": False,
                "allowMultiple": False,
                "dataType": "int",
                "paramType": "query"
            },
        ],
        responseClass=RequestDonationsList.__name__,
        responseMessages=[
            {
                "code": 200,
                "message": "OK"
            },
            InvalidFileType.to_swagger()
        ]
    )
    @marshal_with(RequestDonationsList.resource_fields)
    def get(self):
        'history donation'
        args = get_donations_parser.parse_args()
        blood_type = args['blood_type']
        status = args['status']
        user_id = current_user['user_id']
        blood = mongo.db.blood_types.find_one({'blood_name': blood_type})
        blood_id = None if blood is None else blood['blood_id']
        filters = {}
        if user_id:
            filters['target_id'] = user_id
        if blood_id:
            filters['blood_id'] = blood_id
        if status:
            filters['status'] = status
        donation_cursor = mongo.db.donations.find(filters)
        donation_view = []
        for row in donation_cursor:
            blood = mongo.db.blood_types.find_one({'blood_name': int(row['blood_id'])})
            blood_name = None if blood is None else blood['blood_name']
            user = mongo.db.users.find_one({'user_id': row['user_id']})
            donation = {
                'donation_id': row['request_id'],
                'request_date': row['request_date'],
                'blood_type': blood_name,
                'notes': row['notes'],
                'user': {
                    'firstname': user['firstname'],
                    'lastname': user['lastname'],
                    'contact': user['contact'],
                    'email': user['email'],
                }
            }
            donation_view.append(donation)
        return {'donations': donation_view, 'count': donation_cursor.count()}, 200
