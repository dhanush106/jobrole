import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder, MinMaxScaler
import os

# Define paths
INPUT_FILE = os.path.join(os.path.dirname(__file__), '../career_recommender.csv')
OUTPUT_FILE = os.path.join(os.path.dirname(__file__), '../career_recommender_processed.csv')

def preprocess_data():
    print("--- Starting Training Data Preprocessing ---")
    
    # 1. Load Data
    if not os.path.exists(INPUT_FILE):
        print(f"Error: Input file not found at {INPUT_FILE}")
        return

    df = pd.read_csv(INPUT_FILE)
    print(f"Loaded data with shape: {df.shape}")
    print("Original Data Preview:")
    print(df.head())

    # 2. Detect Columns
    # Assuming standard structure, but let's be dynamic
    # Numeric are usually things like 'cgpa' or ratings (if any)
    # Categorical are text fields
    
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    categorical_cols = df.select_dtypes(exclude=[np.number]).columns.tolist()

    print(f"Numeric Columns: {numeric_cols}")
    print(f"Categorical Columns: {categorical_cols}")

    # 3. Apply Preprocessing
    
    # MinMaxScaler for Numeric
    if numeric_cols:
        scaler = MinMaxScaler()
        df[numeric_cols] = scaler.fit_transform(df[numeric_cols])
        print("Applied MinMaxScaler to numeric columns.")

    # LabelEncoder for Categorical
    # Note: For production pipelines, you'd save these encoders.
    le = LabelEncoder()
    for col in categorical_cols:
        # Convert to string to ensure safe encoding
        df[col] = le.fit_transform(df[col].astype(str))
    print("Applied LabelEncoder to categorical columns.")

    # 4. Save Processed Data
    df.to_csv(OUTPUT_FILE, index=False)
    print(f"Saved processed data to: {OUTPUT_FILE}")

    # 5. Print Preview
    print("Processed Data Preview:")
    print(df.head())

if __name__ == "__main__":
    preprocess_data()
