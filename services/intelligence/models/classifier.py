"""
Traffic Classifier — Supervised classification of network flows.

Categories: normal, suspicious, shadow_ai
Uses Random Forest for fast, interpretable predictions.
"""
import numpy as np
from loguru import logger

try:
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.preprocessing import LabelEncoder
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False


# Traffic categories
LABELS = ["normal", "suspicious", "shadow_ai"]


class TrafficClassifier:
    """
    Supervised traffic classifier.
    
    Requires labeled training data to distinguish between:
    - normal: Regular browsing, internal comms
    - suspicious: Unusual ports, high volume, unknown destinations
    - shadow_ai: Traffic matching AI service patterns
    """

    def __init__(self):
        self.model = None
        self.label_encoder = LabelEncoder()
        self.label_encoder.fit(LABELS)
        self.is_trained = False

                n_jobs=-1,
            )
            self.explainer = None  # Lazy init


    def train(self, X: np.ndarray, y: list):
        """
        Train the classifier.
        
        Args:
            X: Feature matrix (N x D)
            y: Labels list of strings ("normal", "suspicious", "shadow_ai")
        """
        if not SKLEARN_AVAILABLE:
            logger.warning("Cannot train: scikit-learn not available")
            return

        y_encoded = self.label_encoder.transform(y)
        logger.info(f"Training Traffic Classifier on {X.shape[0]} samples...")
        self.model.fit(X, y_encoded)
        self.is_trained = True

        importances = self.model.feature_importances_
        for name, imp in sorted(
            zip(FeatureExtractor.FEATURE_NAMES, importances),
            key=lambda x: x[1], reverse=True
        ):
            logger.info(f"  Feature '{name}': {imp:.4f}")

        # Initialize SHAP explainer
        try:
            import shap
            # Background dataset for TreeExplainer (optional but good for speed/accuracy)
            # For RF, TreeExplainer is usually fast enough without background
            self.explainer = shap.TreeExplainer(self.model)
            logger.info("SHAP Explainer initialized.")
        except ImportError:
            logger.warning("SHAP not available despite training success.")
        except Exception as e:
            logger.error(f"Failed to init SHAP: {e}")


    def predict(self, X: np.ndarray) -> list:
        """
        Classify traffic flows.
        
        Returns:
            List of category strings
        """
        if not self.is_trained or not SKLEARN_AVAILABLE:
            return self._fallback_predict(X)

        # Guard: feature count mismatch
        expected = self.model.n_features_in_
        if X.shape[1] != expected:
            logger.warning(f"Feature mismatch: model expects {expected}, got {X.shape[1]}. Using heuristic fallback.")
            return self._fallback_predict(X)

        y_pred = self.model.predict(X)
        return self.label_encoder.inverse_transform(y_pred).tolist()

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        """
        Get classification probabilities.
        
        Returns:
            Array of shape (N, 3) with [normal, suspicious, shadow_ai] probabilities
        """
        if not self.is_trained or not SKLEARN_AVAILABLE:
            return np.array([[0.8, 0.1, 0.1]] * X.shape[0])

        # Guard: feature count mismatch
        expected = self.model.n_features_in_
        if X.shape[1] != expected:
            return np.array([[0.8, 0.1, 0.1]] * X.shape[0])

        return self.model.predict_proba(X)

    def _fallback_predict(self, X: np.ndarray) -> list:
        """Rule-based fallback when sklearn is unavailable."""
        if len(X.shape) == 1:
            X = X.reshape(1, -1)

        results = []
        for sample in X:
            is_external = sample[6] < 0.5    # not internal dst
            has_hostname = sample[9] > 0.5
            large_payload = sample[2] > 8.0   # log(bytes) > 8 ≈ 3KB+

            if is_external and has_hostname and large_payload:
                results.append("shadow_ai")
            elif is_external and not sample[7]:  # non-standard port
                results.append("suspicious")
            else:
                results.append("normal")

        return results

    def save(self, path: str):
        if SKLEARN_AVAILABLE and self.is_trained:
            import joblib
            joblib.dump({"model": self.model, "encoder": self.label_encoder}, path)
            logger.info(f"Classifier saved to {path}")

    def load(self, path: str):
        if SKLEARN_AVAILABLE:
            import joblib
            data = joblib.load(path)
            self.model = data["model"]
            self.label_encoder = data["encoder"]
            self.is_trained = True
            
            # Re-init explainer if possible
            try:
                import shap
                self.explainer = shap.TreeExplainer(self.model)
            except:
                pass
                
            logger.info(f"Classifier loaded from {path}")

    def explain_prediction(self, X: np.ndarray, top_k=3) -> list:
        """
        Generate SHAP explanations for a prediction.
        
        Args:
            X: Input features (1, D)
            top_k: Number of top features to return
            
        Returns:
            List of strings: ["FeatureX (+0.20)", "FeatureY (-0.10)"]
        """
        if not self.is_trained or not hasattr(self, "explainer") or self.explainer is None:
            return []
            
        try:
            from services.intelligence.features.extractor import FeatureExtractor
            shap_values = self.explainer.shap_values(X)
            
            # shap_values is a list of arrays for each class [class0, class1, class2]
            # We want to explain the predicted class (max prob)
            # But efficiently, let's just use the max magnitude attribution across classes or specific class?
            # Usually we explain the *predicted* class.
            
            pred_idx = self.model.predict(X)[0] # This returns class index if model is generic, but RF returns class label??
            # sklearn RF predict returns class labels (encoded or not? fit with y_encoded)
            # Wait, we trained with y_encoded. So predict returns integer.
            
            class_idx = int(pred_idx) # Should be 0, 1, or 2
            
            # Get values for the predicted class
            # shap_values[class_idx] is shape (1, n_features)
            vals = shap_values[class_idx][0]
            
            # Sort by absolute impact
            feature_names = FeatureExtractor.FEATURE_NAMES
            
            # Check length match
            if len(vals) != len(feature_names):
                return []
                
            sorted_indices = np.argsort(np.abs(vals))[::-1]
            
            explanations = []
            for i in range(min(top_k, len(vals))):
                idx = sorted_indices[i]
                val = vals[idx]
                name = feature_names[idx]
                sign = "+" if val > 0 else ""
                explanations.append(f"{name} ({sign}{val:.2f})")
                
            return explanations
        except Exception as e:
            logger.error(f"SHAP explanation failed: {e}")
            return []

