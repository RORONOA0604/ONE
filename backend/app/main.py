import json
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr

# --- Configuration ---
# In a real app, these would be in a .env file
SECRET_KEY = "a_very_secret_key_that_should_be_long_and_random"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
DB_FILE = "db.json"

# --- Password Hashing ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --- OAuth2 Scheme ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# --- FastAPI App Initialization ---
app = FastAPI()

# --- Pydantic Models (Data Schemas) ---
class UserBase(BaseModel):
    username: str
    email: EmailStr
    
class UserInDB(UserBase):
    id: int
    hashed_password: str
    enrolled_courses: List[int] = []

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    enrolled_courses: List[int] = []

class Course(BaseModel):
    id: int
    title: str
    category: str
    difficulty: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    
class Recommendation(Course):
    reason: str

# --- Database Helper Functions ---
def read_db():
    with open(DB_FILE, "r") as f:
        return json.load(f)

def get_user_by_username(username: str) -> Optional[UserInDB]:
    db = read_db()
    for user_data in db["users"]:
        if user_data["username"] == username:
            return UserInDB(**user_data)
    return None

def get_user_by_id(user_id: int) -> Optional[UserInDB]:
    db = read_db()
    for user_data in db["users"]:
        if user_data["id"] == user_id:
            return UserInDB(**user_data)
    return None

# --- Authentication Helper Functions ---
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = get_user_by_username(username=token_data.username)
    if user is None:
        raise credentials_exception
    return user

# --- API Endpoints ---
@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = get_user_by_username(form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me/", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@app.get("/courses/", response_model=List[Course])
async def read_courses():
    db = read_db()
    return db["courses"]
    
@app.get("/recommendations/", response_model=List[Recommendation])
async def get_recommendations(current_user: User = Depends(get_current_user)):
    """
    This is a simple AI recommendation engine.
    It recommends courses from the same category as the ones the user is already enrolled in.
    
    A more advanced system would use:
    - Collaborative Filtering: Find users with similar tastes and recommend what they liked.
    - Content-Based Filtering: Recommend courses with similar content (title, description, tags).
    - Hybrid Models or Deep Learning: For more complex patterns.
    """
    db = read_db()
    all_courses = {course['id']: course for course in db['courses']}
    
    enrolled_courses = [all_courses[cid] for cid in current_user.enrolled_courses if cid in all_courses]
    enrolled_categories = {course['category'] for course in enrolled_courses}
    
    recommendations = []
    
    for course_data in db["courses"]:
        # Don't recommend courses the user is already taking
        if course_data["id"] in current_user.enrolled_courses:
            continue
            
        if course_data["category"] in enrolled_categories:
            # Find which enrolled course triggered this recommendation
            trigger_course = next((c for c in enrolled_courses if c['category'] == course_data['category']), None)
            
            recommendations.append(
                Recommendation(
                    **course_data, 
                    reason=f"Because you are taking '{trigger_course['title']}'"
                )
            )
            
    # Limit to top 5 recommendations
    return recommendations[:5]
