import json


class BaseExceptions(Exception):

    extra = dict()

    def __init__(self, **kwargs):
        super(BaseExceptions, self).__init__()
        for (key, value) in kwargs.iteritems():
            if key in self.extra_fields:
                self.extra[key] = value

    @classmethod
    def to_swagger(cls):
        reason = {
            "code": cls.code,
            "reason": cls.message,
            "extra_info": cls.extra_fields
        }
        return {
            "code": cls.status_code,
            "message": json.dumps(reason)
        }


class InvalidFileType(BaseExceptions):
    message = "Invalid file type"
    code = 100
    status_code = 400
    extra_fields = ['expected_type']


class MissingSessionID(BaseException):
    """docstring for MissingSessionID"""
    message = "required session id"
    code = 101
    status_code = 400
    extra_fields = ['message']


class MissingAppToken(BaseExceptions):
    message = "required app id"
    code = 102
    status_code = 400
    extra_fields = ['expected_type']


class UnIndetifiedAtribute(BaseExceptions):
    message = "Attribute not found"
    code = 103
    status_code = 400
    extra_fields = ['expected_type']


class FieldRequired(BaseExceptions):
    message = "field cannot empty"
    code = 104
    status_code = 400
    extra_fields = ['required_field']


class InvalidEmailFormat(BaseExceptions):
    message = "Invalid email format"
    code = 105
    status_code = 400
    extra_fields = ['email', 'expected']


class UnAuthorized(BaseExceptions):
    message = "UnAuthorized User"
    code = 130
    status_code = 401
    extra_fields = ['expected_type']


class InvalidGoogleAUTH(BaseExceptions):
    message = "user is not valid"
    code = 131
    status_code = 401
    extra_fields = ['expected_type']


class SessionExpired(BaseExceptions):
    message = "session has expired"
    code = 132
    status_code = 401
    extra_fields = ['expected_type']


class InvalidTokenType(BaseExceptions):
    message = "Invalid Token type in Authorization Header"
    code = 134
    status_code = 401
    extra_fields = ['expected_token_type', 'actual_token_type']


class IncorrectPassword(BaseExceptions):
    message = "Invalid password"
    code = 135
    status_code = 401
    extra_fields = ['password']


class AccessUserPermissionDenied(BaseExceptions):
    message = "User does not have permission to access this user data"
    code = 401
    status_code = 403
    extra_fields = ['accessing_user_id', 'accessed_user_id', 'accessed_data_type', 'access_type']


class UserNotFound(BaseExceptions):
    message = "User not found"
    code = 160
    status_code = 404
    extra_fields = ['message']


class CategoryNotFound(BaseExceptions):
    message = "Category not found"
    code = 161
    status_code = 404
    extra_fields = []


class MallNotFound(BaseExceptions):
    message = "Mall not found"
    code = 162
    status_code = 404
    extra_fields = []


class StoreNotFound(BaseExceptions):
    message = "Store not found"
    code = 163
    status_code = 404
    extra_fields = []


class TenantNotFound(BaseExceptions):
    message = "Tenant not found"
    code = 164
    status_code = 404
    extra_fields = []


class ArticleNotFound(BaseExceptions):
    message = "Article not found"
    code = 165
    status_code = 404
    extra_fields = []


class CampaignNotFound(BaseExceptions):
    message = "Campaign not found"
    code = 167
    status_code = 404
    extra_fields = []


class FileNotFound(BaseExceptions):
    message = "File not found"
    code = 166
    status_code = 404
    extra_fields = []


class BloodNotFound(BaseExceptions):
    message = "Blood not found"
    code = 167
    status_code = 404
    extra_fields = []


class EmailConflict(BaseExceptions):
    message = "Email address has taken"
    code = 190
    status_code = 409
    extra_fields = ['email']


class InternalError(BaseExceptions):
    message = "Unknown error"
    code = 700
    status_code = 500
    extra_fields = ['response']


class ErrorDeletedObject(BaseExceptions):
    message = "Error when deleting object"
    code = 700
    status_code = 500
    extra_fields = ['id']
