import pandas as pd
import numpy as np
import os
import re
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from xgboost import XGBClassifier

# ------------------------------------------------------------
# 1. LOAD LOCAL DATASET (Dice.com Jobs)
# ------------------------------------------------------------

# Get the directory of the current script
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INPUT_FILE = os.path.join(BASE_DIR, 'jobrole.csv')
MODELS_DIR = os.path.join(BASE_DIR, 'models')

if not os.path.exists(MODELS_DIR):
    os.makedirs(MODELS_DIR)

print("Loading dataset from:", INPUT_FILE)
df = pd.read_csv(INPUT_FILE)

# Select and clean columns as per user snippet
df = df[['jobtitle', 'jobdescription', 'skills']]
df = df.dropna()

print("Original Dataset Shape:", df.shape)

# ------------------------------------------------------------
# 2. CLEAN TEXT (REFINED FOR TECH)
# ------------------------------------------------------------
def clean_text(text):
    text = str(text).lower()
    text = re.sub(r'<.*?>', ' ', text) # Remove HTML
    # Preserve key tech characters: # (C#), + (C++), . (.NET)
    text = re.sub(r'[^a-z0-9#+.]', ' ', text) 
    text = re.sub(r'\s+', ' ', text) # Remove extra whitespace
    return text.strip()

print("Cleaning text data...")
df['jobdescription'] = df['jobdescription'].apply(clean_text)
df['skills'] = df['skills'].apply(clean_text)

# Combine description + skills
df['text'] = df['jobdescription'] + " " + df['skills']

# ------------------------------------------------------------
# 3. REMOVE RARE JOB ROLES
# ------------------------------------------------------------
MIN_SAMPLES = 50 # Lowered slightly to include more specific roles if data allows
role_counts = df['jobtitle'].value_counts()
valid_roles = role_counts[role_counts >= MIN_SAMPLES].index
df = df[df['jobtitle'].isin(valid_roles)]

print("After Filtering Shape:", df.shape)
print("Number of Job Roles:", df['jobtitle'].nunique())

# Save preprocessed data for fast retraining (Phase 10)
PREPROCESSED_DATA = os.path.join(MODELS_DIR, 'preprocessed_data.joblib')
joblib.dump(df[['text', 'jobtitle']], PREPROCESSED_DATA)
print(f"Preprocessed data cached for fast retraining at: {PREPROCESSED_DATA}")

# ------------------------------------------------------------
# 4. ENCODE TARGET
# ------------------------------------------------------------
label_encoder = LabelEncoder()
df['job_encoded'] = label_encoder.fit_transform(df['jobtitle'])

# ------------------------------------------------------------
# 5. TRAIN TEST SPLIT
# ------------------------------------------------------------
X_train, X_test, y_train, y_test = train_test_split(
    df['text'],
    df['job_encoded'],
    test_size=0.15, # Slightly more training data
    random_state=42,
    stratify=df['job_encoded']
)

# ------------------------------------------------------------
# 6. PIPELINE (OPTIMIZED FOR 95% ACCURACY)
# ------------------------------------------------------------
pipeline = Pipeline([
    ("tfidf", TfidfVectorizer(
        max_features=20000, 
        ngram_range=(1,3), # Tri-grams for better context
        stop_words="english",
        sublinear_tf=True
    )),
    ("xgb", XGBClassifier(
        objective="multi:softprob",
        num_class=len(label_encoder.classes_),
        n_estimators=300, # Significantly increased
        max_depth=8,      # Increased depth
        learning_rate=0.05, # Lower LR for better convergence
        eval_metric="mlogloss",
        tree_method="hist",
        device="cpu", # Ensure compatibility
        random_state=42
    ))
])

# ------------------------------------------------------------
# 7. TRAIN MODEL
# ------------------------------------------------------------
print(f"Training Optimized XGBoost model on {len(label_encoder.classes_)} classes...")
pipeline.fit(X_train, y_train)

# ------------------------------------------------------------
# 8. EVALUATION
# ------------------------------------------------------------
y_pred = pipeline.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)

print("\nMODEL ACCURACY:", round(accuracy * 100, 2), "%")
print("\nCLASSIFICATION REPORT\n")
print(classification_report(
    y_test,
    y_pred,
    target_names=label_encoder.classes_,
    zero_division=0
))

# Save Confusion Matrix to a separate file if it fits, else just summary
# cm = confusion_matrix(y_test, y_pred)
# print("\nCONFUSION MATRIX (Summary)")
# print(f"Shape: {cm.shape}")

# ------------------------------------------------------------
# 9. SAVE ARTIFACTS & SKILL PROFILES
# ------------------------------------------------------------
joblib.dump(pipeline, os.path.join(MODELS_DIR, 'xgboost_pipeline.joblib'))
joblib.dump(label_encoder, os.path.join(MODELS_DIR, 'label_encoder.joblib'))

# Extract Skill Profiles for each role (Top 10 skills per role)
print("\nExtracting skill profiles for each role...")
skill_profiles = {}
for role in label_encoder.classes_:
    role_df = df[df['jobtitle'] == role]
    # Tokenize all skills for this role
    all_skills = " ".join(role_df['skills'].tolist()).split()
    if all_skills:
        # Get top 10 unique skills
        top_skills = pd.Series(all_skills).value_counts().head(10).index.tolist()
        skill_profiles[role] = top_skills
    else:
        skill_profiles[role] = []

joblib.dump(skill_profiles, os.path.join(MODELS_DIR, 'skill_profiles.joblib'))

print(f"\nSUCCESS: Model, Encoder, and Skill Profiles saved to {MODELS_DIR}")
