"""
Database Reset Script
This script drops and recreates the entire database with the correct schema.
WARNING: This will delete ALL data in the database!
"""
from app.core.database import engine
from app.models.models import Base
from app.core.config import Config
from sqlalchemy import text, create_engine
import os

def reset_database():
    print("⚠️  WARNING: This will delete ALL data in the database!")
    confirm = input("Type 'yes' to continue: ")
    
    if confirm.lower() != 'yes':
        print("Aborted.")
        return
    
    # Get database credentials from Config
    mysql_host = Config.MYSQL_HOST
    mysql_port = Config.MYSQL_PORT
    mysql_user = Config.MYSQL_USER
    mysql_password = Config.MYSQL_PASSWORD
    db_name = Config.MYSQL_DB
    
    if not mysql_password:
        print("❌ MYSQL_PASSWORD not found in environment variables")
        return
    
    # Construct database URLs
    base_url = f"mysql+pymysql://{mysql_user}:{mysql_password}@{mysql_host}:{mysql_port}"
    
    print(f"\n🗑️  Dropping and recreating database: {db_name}...")
    
    try:
        # Connect to MySQL without specifying a database
        base_engine = create_engine(base_url)
        
        with base_engine.connect() as conn:
            # Drop the database if it exists
            conn.execute(text(f"DROP DATABASE IF EXISTS {db_name}"))
            conn.commit()
            print(f"   ✓ Dropped database: {db_name}")
            
            # Create the database
            conn.execute(text(f"CREATE DATABASE {db_name} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"))
            conn.commit()
            print(f"   ✓ Created database: {db_name}")
        
        base_engine.dispose()
        
        print("\n🔨 Creating all tables with new schema...")
        Base.metadata.create_all(bind=engine)
        print("   ✓ All tables created successfully!")
        
        print("\n✅ Database reset complete!")
        print("   All tables now use VARCHAR(36) for IDs (UUID compatible)")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("\nTroubleshooting:")
        print("1. Make sure MySQL server is running")
        print("2. Check your .env file has correct database credentials")
        print("3. Ensure your MySQL user has database creation privileges")

if __name__ == "__main__":
    reset_database()
