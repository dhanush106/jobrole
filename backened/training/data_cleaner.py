import pandas as pd
import numpy as np
import re
import os

INPUT_FILE = r'C:\Users\vpran\OneDrive\Desktop\milestone\jobrole-main\career_recommender.csv'
OUTPUT_FILE = r'C:\Users\vpran\OneDrive\Desktop\milestone\jobrole-main\training\cleaned_career_data.csv'

def clean_role(role):
    if pd.isna(role):
        return 'Other'
    role = str(role).lower().strip()
    
    if 'student' in role or 'unemployed' in role or 'na' == role or 'no' == role:
        return np.nan
    
    # Mapping logic
    if any(kw in role for keyword in ['software', 'developer', 'programmer', 'web', 'backend', 'front', 'full stack', 'java dev']) :
        if 'test' in role or 'qa' in role: return 'QA/Testing'
        return 'Software Developer'
    
    if any(kw in role for kw in ['data', 'analyst', 'analyst', 'bi', 'business analyst']):
        if 'business' in role: return 'Business Analyst'
        return 'Data Professional'
        
    if 'mechanical' in role or 'design engineer' in role:
        return 'Mechanical Engineer'
        
    if 'civil' in role or 'structural' in role:
        return 'Civil Engineer'
        
    if 'teacher' in role or 'teaching' in role or 'professor' in role or 'education' in role:
        return 'Educator/Teacher'
    
    if 'sales' in role or 'marketing' in role or 'business development' in role:
        return 'Sales & Marketing'
        
    if 'hr' in role or 'resource' in role:
        return 'Human Resources'
        
    if 'manager' in role or 'lead' in role or 'management' in role:
        return 'Management/Leadership'
        
    if 'bank' in role or 'finance' in role or 'account' in role:
        return 'Finance/Accounting'

    return 'Other'

def normalize_cgpa(val):
    try:
        if pd.isna(val): return 7.0 # Default/Mean
        val = float(val)
        if val > 10: # Likely out of 100
            val = val / 10.0
        if val > 10: val = 10.0 # Cap
        return val
    except:
        return 7.0

def clean_dataset():
    df = pd.read_csv(INPUT_FILE)
    
    # 1. Standardize Column Names (Easier to work with)
    cols = {
        df.columns[1]: 'gender',
        df.columns[2]: 'ug_course',
        df.columns[3]: 'ug_specialization',
        df.columns[4]: 'interests',
        df.columns[5]: 'skills',
        df.columns[6]: 'cgpa',
        df.columns[8]: 'certificates',
        df.columns[10]: 'target_role'
    }
    df = df.rename(columns=cols)
    
    # 2. Drop rows where target role indicates student/unemployed
    df['target_role'] = df['target_role'].apply(clean_role)
    df = df.dropna(subset=['target_role'])
    
    # 3. Normalize CGPA
    df['cgpa'] = df['cgpa'].apply(normalize_cgpa)
    
    # 4. Fill missing
    df['interests'] = df['interests'].fillna('None')
    df['skills'] = df['skills'].fillna('None')
    df['certificates'] = df['certificates'].fillna('None')
    df['ug_specialization'] = df['ug_specialization'].fillna('General')
    
    # 5. Clean Skills/Interests strings
    # Replace separators like ; or , or newlines with a single comma
    def standardize_list(text):
        if not isinstance(text, str): return ""
        text = text.replace('\n', ',').replace(';', ',')
        parts = [p.strip().lower() for p in text.split(',') if p.strip()]
        return "|".join(parts) # Use pipe as internal separator for later MLB

    df['skills'] = df['skills'].apply(standardize_list)
    df['interests'] = df['interests'].apply(standardize_list)
    df['certificates'] = df['certificates'].apply(standardize_list)
    
    # 6. Keep only relevant columns
    df = df[['gender', 'ug_course', 'ug_specialization', 'interests', 'skills', 'cgpa', 'certificates', 'target_role']]
    
    df.to_csv(OUTPUT_FILE, index=False)
    print(f"Cleaned data saved to {OUTPUT_FILE}")
    print("Unique Roles after consolidation:", df['target_role'].nunique())
    print(df['target_role'].value_counts().head(10))

if __name__ == "__main__":
    clean_dataset()
