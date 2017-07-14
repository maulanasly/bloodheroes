class BaseConfig(object):
    ADMINS = []
    DEBUG = True
    TESTING = False
    VERBOSE = False
    PROPAGATE_EXCEPTIONS = True

    SENTRY_DSN = ""
    SENTRY_RELEASE = "v0.1-rc1"
    APP_SECRET = "bloodheroes"
    EXPIRED_DAYS = 360

    ALLOWED_EXTENSIONS = set(['png', 'jpg', 'jpeg', 'gif', 'JPG', 'PNG', 'JPEG'])
    CLOUDINARY_URL = "cloudinary://488657822359976:AGCI0cD84C2MU325r61V_VWhbHE@bloodheroes-dev"
    CLOUD_API_KEY = ""
    CLOUD_API_SECRET = ""
    CLOUD_API_NAME = ""


class DevelopmentConfig(BaseConfig):
    CLOUD_API_KEY = 488657822359976
    CLOUD_API_SECRET = "AGCI0cD84C2MU325r61V_VWhbHE"
    CLOUD_API_NAME = "bloodheroes-dev"


class TestingConfig(BaseConfig):
    APP_MODE = "unit_test"
    TESTING = True
    DEBUG = True
    MONGO_DBNAME = 'bloodheroes_test'


class StagingConfig(BaseConfig):
    CLOUD_API_KEY = 488657822359976
    CLOUD_API_SECRET = "AGCI0cD84C2MU325r61V_VWhbHE"
    CLOUD_API_NAME = "bloodheroes-dev"


class ProductionConfig(BaseConfig):
    pass


config = {
    "development": "bloodheroes.config.DevelopmentConfig",
    "testing": "bloodheroes.config.TestingConfig",
    "staging": "bloodheroes.config.StagingConfig",
    "production": "bloodheroes.config.ProductionConfig"
}
