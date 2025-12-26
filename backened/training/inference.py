import sys
import json
import os
import joblib
import numpy as np

# Suppress warnings
import warnings
warnings.filterwarnings("ignore")

MODELS_DIR = r'C:\Users\vpran\OneDrive\Desktop\milestone\jobrole-main\models'

def load_artifacts():
    try:
        pipeline = joblib.load(os.path.join(MODELS_DIR, 'xgboost_pipeline.joblib'))
        le = joblib.load(os.path.join(MODELS_DIR, 'label_encoder.joblib'))
        skills_profiles = joblib.load(os.path.join(MODELS_DIR, 'skill_profiles.joblib'))
        return pipeline, le, skills_profiles
    except Exception as e:
        print(json.dumps({"error": f"Failed to load models: {str(e)}"}))
        sys.exit(1)

def predict(input_data):
    pipeline, le, skill_profiles = load_artifacts()
    
    # Preprocess input (same as training)
    def clean_text(text):
        import re
        text = str(text).lower()
        text = re.sub(r'[^a-z ]', ' ', text)
        text = re.sub(r'\s+', ' ', text)
        return text.strip()

    combined_text = clean_text(f"{input_data.get('ug_course', '')} {input_data.get('ug_specialization', '')} {input_data.get('interests', '')} {input_data.get('skills', '')} {input_data.get('certificates', '')}")
    
    # Get probabilities
    probs = pipeline.predict_proba([combined_text])[0]
    top_k = 5
    top_indices = np.argsort(probs)[-top_k:][::-1]
    
    user_skills = set(clean_text(input_data.get('skills', '')).split())
    
    results = []
    for idx in top_indices:
        role = le.inverse_transform([idx])[0]
        confidence = float(probs[idx]) * 100
        
        # Skill mismatch analysis
        required_skills = skill_profiles.get(role, [])
        missing_skills = [s for s in required_skills if s not in user_skills][:5]
        
        results.append({
            "role": role,
            "confidence": round(confidence, 2),
            "missing_skills": missing_skills
        })
    
    return results

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No input data provided"}))
        sys.exit(1)
    
    try:
        raw_input = sys.argv[1]
        input_data = json.loads(raw_input)
        predictions = predict(input_data)
        print(json.dumps(predictions))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
