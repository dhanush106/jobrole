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
INPUT_FILE = r'c:\Users\sarpo\Downloads\jobrole-main\backened\jobrole.csv'
MODELS_DIR = r'c:\Users\sarpo\Downloads\jobrole-main\backened\models'

if not os.path.exists(MODELS_DIR):
    os.makedirs(MODELS_DIR)

print("Loading dataset from:", INPUT_FILE)
df = pd.read_csv(INPUT_FILE)

# Select and clean columns as per user snippet
df = df[['jobtitle', 'jobdescription', 'skills']]
df = df.dropna()

print("Original Dataset Shape:", df.shape)

# ------------------------------------------------------------
# 2. CLEAN TEXT
# ------------------------------------------------------------
def clean_text(text):
    text = str(text).lower()
    text = re.sub(r'<.*?>', ' ', text) # Remove HTML
    text = re.sub(r'[^a-z ]', ' ', text) # Remove non-alpha
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
MIN_SAMPLES = 100 # Increased for better stability on large dataset
role_counts = df['jobtitle'].value_counts()
valid_roles = role_counts[role_counts >= MIN_SAMPLES].index
df = df[df['jobtitle'].isin(valid_roles)]

print("After Filtering Shape:", df.shape)
print("Number of Job Roles:", df['jobtitle'].nunique())

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
    test_size=0.2,
    random_state=42,
    stratify=df['job_encoded']
)

# ------------------------------------------------------------
# 6. PIPELINE (TF-IDF + XGBOOST)
# ------------------------------------------------------------
pipeline = Pipeline([
    ("tfidf", TfidfVectorizer(
        max_features=10000, # Reduced for memory/speed
        ngram_range=(1,2),
        stop_words="english",
        sublinear_tf=True
    )),
    ("xgb", XGBClassifier(
        objective="multi:softprob",
        num_class=len(label_encoder.classes_),
        n_estimators=20, # Reduced for faster local training
        max_depth=6,
        learning_rate=0.1,
        eval_metric="mlogloss",
        tree_method="hist",
        random_state=42
    ))
])

# ------------------------------------------------------------
# 7. TRAIN MODEL
# ------------------------------------------------------------
print(f"Training XGBoost model on {len(label_encoder.classes_)} classes...")
pipeline.fit(X_train, y_train)

# ------------------------------------------------------------
# 8. EVALUATION
# ------------------------------------------------------------
y_pred = pipeline.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)

print("\n📊 MODEL ACCURACY:", round(accuracy * 100, 2), "%")
print("\n📄 CLASSIFICATION REPORT\n")
print(classification_report(
    y_test,
    y_pred,
    target_names=label_encoder.classes_,
    zero_division=0
))

# Save Confusion Matrix to a separate file if it fits, else just summary
# cm = confusion_matrix(y_test, y_pred)
# print("\n📉 CONFUSION MATRIX (Summary)")
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

print(f"\n✅ Model, Encoder, and Skill Profiles saved to {MODELS_DIR}")
