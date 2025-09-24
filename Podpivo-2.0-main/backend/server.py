from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext
import asyncio

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT and Security
JWT_SECRET = os.environ.get('JWT_SECRET', 'netflix-secret-key-123')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION = 24  # hours

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Create the main app
app = FastAPI(title="Netflix Clone API")

# Create API router
api_router = APIRouter(prefix="/api")

# Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Genre(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    name_ru: str

class Movie(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    title_ru: str
    description: str
    description_ru: str
    year: int
    duration: int  # minutes
    genre_ids: List[str]
    poster_url: str
    trailer_url: str
    video_url: Optional[str] = None
    rating: float = 0.0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MovieCreate(BaseModel):
    title: str
    title_ru: str
    description: str
    description_ru: str
    year: int
    duration: int
    genre_ids: List[str]
    poster_url: str
    trailer_url: str
    video_url: Optional[str] = None
    rating: float = 0.0

class UserList(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    movie_id: str
    list_type: str  # "favorites", "watched"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Helper functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_jwt_token(user_id: str) -> str:
    payload = {
        'user_id': user_id,
        'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get('user_id')
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({'id': user_id})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        return User(**user)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Auth endpoints
@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({'email': user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user = User(
        email=user_data.email,
        name=user_data.name
    )
    user_dict = user.dict()
    user_dict['password_hash'] = hash_password(user_data.password)
    
    await db.users.insert_one(user_dict)
    
    # Generate token
    token = create_jwt_token(user.id)
    
    return {
        'user': user,
        'token': token,
        'message': 'Registration successful'
    }

@api_router.post("/auth/login")
async def login(login_data: UserLogin):
    # Find user
    user_data = await db.users.find_one({'email': login_data.email})
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Verify password
    if not verify_password(login_data.password, user_data['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user = User(**user_data)
    token = create_jwt_token(user.id)
    
    return {
        'user': user,
        'token': token,
        'message': 'Login successful'
    }

@api_router.get("/auth/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# Movies endpoints
@api_router.get("/movies", response_model=List[Movie])
async def get_movies(
    search: Optional[str] = None,
    genre_id: Optional[str] = None,
    limit: int = 20,
    skip: int = 0
):
    query = {}
    
    if search:
        query['$or'] = [
            {'title': {'$regex': search, '$options': 'i'}},
            {'title_ru': {'$regex': search, '$options': 'i'}},
            {'description': {'$regex': search, '$options': 'i'}},
            {'description_ru': {'$regex': search, '$options': 'i'}}
        ]
    
    if genre_id:
        query['genre_ids'] = genre_id
    
    movies = await db.movies.find(query).skip(skip).limit(limit).to_list(length=None)
    return [Movie(**movie) for movie in movies]

@api_router.get("/movies/{movie_id}", response_model=Movie)
async def get_movie(movie_id: str):
    movie = await db.movies.find_one({'id': movie_id})
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    return Movie(**movie)

@api_router.post("/movies", response_model=Movie)
async def create_movie(movie_data: MovieCreate):
    movie = Movie(**movie_data.dict())
    await db.movies.insert_one(movie.dict())
    return movie

# Genres endpoints
@api_router.get("/genres", response_model=List[Genre])
async def get_genres():
    genres = await db.genres.find().to_list(length=None)
    return [Genre(**genre) for genre in genres]

@api_router.post("/genres", response_model=Genre)
async def create_genre(genre: Genre):
    await db.genres.insert_one(genre.dict())
    return genre

# User Lists endpoints
@api_router.post("/user/lists")
async def add_to_list(
    movie_id: str,
    list_type: str,  # "favorites" or "watched"
    current_user: User = Depends(get_current_user)
):
    # Check if already in list
    existing = await db.user_lists.find_one({
        'user_id': current_user.id,
        'movie_id': movie_id,
        'list_type': list_type
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Already in list")
    
    user_list = UserList(
        user_id=current_user.id,
        movie_id=movie_id,
        list_type=list_type
    )
    
    await db.user_lists.insert_one(user_list.dict())
    return {'message': f'Added to {list_type}'}

@api_router.delete("/user/lists")
async def remove_from_list(
    movie_id: str,
    list_type: str,
    current_user: User = Depends(get_current_user)
):
    result = await db.user_lists.delete_one({
        'user_id': current_user.id,
        'movie_id': movie_id,
        'list_type': list_type
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found in list")
    
    return {'message': f'Removed from {list_type}'}

@api_router.get("/user/lists/{list_type}")
async def get_user_list(
    list_type: str,
    current_user: User = Depends(get_current_user)
):
    user_lists = await db.user_lists.find({
        'user_id': current_user.id,
        'list_type': list_type
    }).to_list(length=None)
    
    movie_ids = [item['movie_id'] for item in user_lists]
    movies = await db.movies.find({'id': {'$in': movie_ids}}).to_list(length=None)
    
    return [Movie(**movie) for movie in movies]

# Initialize sample data
@api_router.post("/init-data")
async def init_sample_data():
    # Create genres
    sample_genres = [
        Genre(id="action", name="Action", name_ru="Боевик"),
        Genre(id="drama", name="Drama", name_ru="Драма"),
        Genre(id="comedy", name="Comedy", name_ru="Комедия"),
        Genre(id="thriller", name="Thriller", name_ru="Триллер"),
        Genre(id="sci-fi", name="Sci-Fi", name_ru="Фантастика"),
        Genre(id="horror", name="Horror", name_ru="Ужасы"),
    ]
    
    for genre in sample_genres:
        existing = await db.genres.find_one({'id': genre.id})
        if not existing:
            await db.genres.insert_one(genre.dict())
    
    # Create sample movies
    sample_movies = [
        MovieCreate(
            title="The Matrix",
            title_ru="Матрица",
            description="A computer programmer discovers reality is a simulation.",
            description_ru="Программист обнаруживает, что реальность - это симуляция.",
            year=1999,
            duration=136,
            genre_ids=["action", "sci-fi"],
            poster_url="https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
            trailer_url="https://www.youtube.com/watch?v=vKQi3bBA1y8",
            rating=8.7
        ),
        MovieCreate(
            title="Inception",
            title_ru="Начало",
            description="A thief enters dreams to steal secrets.",
            description_ru="Вор проникает в сны, чтобы красть секреты.",
            year=2010,
            duration=148,
            genre_ids=["action", "thriller", "sci-fi"],
            poster_url="https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
            trailer_url="https://www.youtube.com/watch?v=YoHD9XEInc0",
            rating=8.8
        ),
        MovieCreate(
            title="The Dark Knight",
            title_ru="Темный рыцарь",
            description="Batman faces his greatest challenge with the Joker.",
            description_ru="Бэтмен сталкивается с величайшим вызовом - Джокером.",
            year=2008,
            duration=152,
            genre_ids=["action", "drama", "thriller"],
            poster_url="https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
            trailer_url="https://www.youtube.com/watch?v=EXeTwQWrcwY",
            rating=9.0
        ),
        MovieCreate(
            title="Pulp Fiction",
            title_ru="Криминальное чтиво",
            description="Multiple interconnected criminal stories in Los Angeles.",
            description_ru="Несколько взаимосвязанных криминальных историй в Лос-Анджелесе.",
            year=1994,
            duration=154,
            genre_ids=["drama", "thriller"],
            poster_url="https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
            trailer_url="https://www.youtube.com/watch?v=s7EdQ4FqbhY",
            rating=8.9
        )
    ]
    
    for movie_data in sample_movies:
        movie = Movie(**movie_data.dict())
        existing = await db.movies.find_one({'title': movie.title})
        if not existing:
            await db.movies.insert_one(movie.dict())
    
    return {'message': 'Sample data initialized successfully'}

# Include router
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()