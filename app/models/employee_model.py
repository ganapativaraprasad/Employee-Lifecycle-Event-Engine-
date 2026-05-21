from beanie import Document


class Employee(Document):
    first_name: str
    last_name: str
    email: str
    department: str
    current_state: str

    class Settings:
        name = "employees"