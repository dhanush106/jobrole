import pandas as pd
import numpy as np
import os
import sys
import joblib
import json
from sklearn.pipeline import Pipeline
from xgboost import XGBClassifier

# Get the directory of the current script
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(os.path.dirname(BASE_DIR), 'models')
ORIGINAL_DATA_FILE = os.path.join(os.path.dirname(BASE_DIR), 'jobrole.csv')

def clean_text(text):
    import re
    text = str(text).lower()
    text = re.sub(r'<.*?>', ' ', text)
    text = re.sub(r'[^a-z0-9#+.]', ' ', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def retrain(feedback_csv_path):
    try:
        PREPROCESSED_CACHE = os.path.join(MODELS_DIR, 'preprocessed_data.joblib')
        
        if os.path.exists(PREPROCESSED_CACHE):
            print(f"[CACHE] Loading cached preprocessed data: {PREPROCESSED_CACHE}")
            df_orig = joblib.load(PREPROCESSED_CACHE)
            df_orig = df_orig.rename(columns={'jobtitle': 'target_role'})
        else:
            print(f"[WARN] Cache not found. Loading original data: {ORIGINAL_DATA_FILE}")
            df_orig = pd.read_csv(ORIGINAL_DATA_FILE)
            df_orig = df_orig[['jobtitle', 'jobdescription', 'skills']].dropna()
            df_orig['jobdescription'] = df_orig['jobdescription'].apply(clean_text)
            df_orig['skills'] = df_orig['skills'].apply(clean_text)
            df_orig['text'] = df_orig['jobdescription'] + " " + df_orig['skills']
            df_orig = df_orig.rename(columns={'jobtitle': 'target_role'})
            # Optional: save cache here
            joblib.dump(df_orig[['text', 'target_role']], PREPROCESSED_CACHE)
        
        print(f"Loading feedback data: {feedback_csv_path}")
        df_feedback = pd.read_csv(feedback_csv_path)
        
        feedback_mapped = pd.DataFrame()
        # Ensure feedback text is cleaned same way
        feedback_mapped['text'] = df_feedback['userSkills'].apply(lambda x: clean_text(x.replace(',', ' ')))
        feedback_mapped['target_role'] = df_feedback['actualRole']
        
        # Merge
        df_combined = pd.concat([df_orig[['text', 'target_role']], feedback_mapped], ignore_index=True)
        
        print(f"Combined dataset size: {len(df_combined)}")
        
        from sklearn.preprocessing import LabelEncoder
        le = LabelEncoder()
        df_combined['job_encoded'] = le.fit_transform(df_combined['target_role'])
        
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.pipeline import Pipeline
        from xgboost import XGBClassifier
        
        # Optimized Pipeline (Sync with train_xgboost.py)
        pipeline = Pipeline([
            ("tfidf", TfidfVectorizer(max_features=20000, ngram_range=(1,3), stop_words="english", sublinear_tf=True)),
            ("xgb", XGBClassifier(
                objective="multi:softprob",
                num_class=len(le.classes_), 
                n_estimators=300, 
                max_depth=8, 
                learning_rate=0.05, 
                tree_method="hist",
                device="cpu",
                random_state=42
            ))
        ])
        
        print("Fitting optimized model...")
        from sklearn.model_selection import train_test_split
        from sklearn.metrics import accuracy_score, precision_recall_fscore_support
        
        X_train, X_test, y_train, y_test = train_test_split(
            df_combined['text'], 
            df_combined['job_encoded'], 
            test_size=0.15, 
            random_state=42
        )
        
        pipeline.fit(X_train, y_train)
        
        # Calculate Metrics
        y_pred = pipeline.predict(X_test)
        probs = pipeline.predict_proba(X_test)
        max_probs = np.max(probs, axis=1)
        
        acc = accuracy_score(y_test, y_pred)
        precision, recall, f1, _ = precision_recall_fscore_support(y_test, y_pred, average='weighted', zero_division=0)
        
        conf_dist = {
            "low": int(np.sum(max_probs < 0.4)),
            "medium": int(np.sum((max_probs >= 0.4) & (max_probs < 0.7))),
            "high": int(np.sum(max_probs >= 0.7))
        }
        
        metrics_output = {
            "accuracy": float(acc),
            "precision": float(precision),
            "recall": float(recall),
            "f1Score": float(f1),
            "trainedOnDataCount": int(len(df_combined)),
            "confidenceDistribution": conf_dist,
            "modelVersion": "1.1.0" # Incremented
        }
        
        # Save updated models
        joblib.dump(pipeline, os.path.join(MODELS_DIR, 'xgboost_pipeline.joblib'))
        joblib.dump(le, os.path.join(MODELS_DIR, 'label_encoder.joblib'))
        
        # Update skill profiles
        skill_profiles = {}
        for role in le.classes_:
            role_df = df_combined[df_combined['target_role'] == role]
            all_text = " ".join(role_df['text'].tolist()).split()
            if all_text:
                top_skills = pd.Series(all_text).value_counts().head(10).index.tolist()
                skill_profiles[role] = top_skills
        
        joblib.dump(skill_profiles, os.path.join(MODELS_DIR, 'skill_profiles.joblib'))
        
        print(f"METRICS_JSON:{json.dumps(metrics_output)}")
        print("DONE: Model retrained and saved successfully.")
        return True
    except Exception as e:
        print(f"ERROR: Retraining Error: {str(e)}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python retrain_model.py <feedback_csv_path>")
        sys.exit(1)
        
    feedback_path = sys.argv[1]
    retrain(feedback_path)
