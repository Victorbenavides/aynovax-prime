import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, accuracy_score

# Configuration
INPUT_FILE = 'aynovax_manufacturing_data.csv'
MODEL_ARTIFACT_NAME = 'production_model.joblib'

def load_data(filepath):
    """Loads the dataset and separates features from the target."""
    df = pd.read_csv(filepath)
    
    # We drop 'timestamp', 'batch_id' because they are metadata, not physical predictors.
    # We drop 'quality_status' because it's the answer (y).
    X = df.drop(['quality_status', 'timestamp', 'batch_id'], axis=1)
    y = df['quality_status']
    
    return X, y

def train():
    print(">>> Loading Data...")
    X, y = load_data(INPUT_FILE)
    
    # Split: 80% for training the brain, 20% for testing exam
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print(f"    Tramining saples: {X_train.shape[0]}")
    print(f"    Testing samples:  {X_test.shape[0]}")

    # --- (Pipeline) ---
    # We bundle the Scaler (Pre-processing) and the Classifier (Model) together.
    pipeline = Pipeline([
        ('scaler', StandardScaler()), # Normalizes data (Z-score)
        ('classifier', RandomForestClassifier(n_estimators=100, random_state=42))
    ])

    print(">>> Training Model (Random Forest)...")
    pipeline.fit(X_train, y_train)

    print(">>> Evaluating Performance...")
    predictions = pipeline.predict(X_test)
    acc = accuracy_score(y_test, predictions)
    
    print(f"\n[METRICS SUMMARY]")
    print(f"Accuracy: {acc:.2%}")
    print("-" * 60)
    print("Detailed Classification Report:")
    print(classification_report(y_test, predictions))
    print("-" * 60)

    # Saving the brain for the Backend to use
    print(f">>> Saving artifact to {MODEL_ARTIFACT_NAME}...")
    joblib.dump(pipeline, MODEL_ARTIFACT_NAME)
    print("[SUCCESS] Model is ready for deployment.")

if __name__ == "__main__":
    train()