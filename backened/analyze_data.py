import pandas as pd
import os

INPUT_FILE = r'C:\Users\vpran\OneDrive\Desktop\milestone\jobrole-main\career_recommender.csv'

def analyze():
    df = pd.read_csv(INPUT_FILE)
    print("Columns:", df.columns.tolist())
    
    target_col = df.columns[10] # "If yes, then what is/was your first Job title..."
    print("\nTarget Column:", target_col)
    
    # Filter out NA/No answers for target if needed, or see what roles are there
    roles = df[target_col].value_counts()
    print("\nNumber of unique roles:", len(roles))
    print("\nTop 20 Roles:")
    print(roles.head(20))
    
    print("\nSample Skills:")
    print(df[df.columns[5]].head(10))

if __name__ == "__main__":
    analyze()
