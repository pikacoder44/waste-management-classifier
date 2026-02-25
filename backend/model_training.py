# type: ignore
import os
import json
from tensorflow.keras import layers, models
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.preprocessing.image import ImageDataGenerator


import matplotlib.pyplot as plt

# ===============================
# 1️⃣ Define Dataset Paths
# ===============================

# Get the directory of this script
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
train_dir = os.path.join(SCRIPT_DIR, "dataset", "train")
test_dir = os.path.join(SCRIPT_DIR, "dataset", "test")

IMG_SIZE = (224, 224)
BATCH_SIZE = 32
EPOCHS = 20

print(f"Dataset paths:")
print(f"  Train: {train_dir}")
print(f"  Test: {test_dir}")

# ===============================
# 2️⃣ Data Preprocessing with Augmentation
# ===============================

train_datagen = ImageDataGenerator(
    rescale=1.0 / 255,
    rotation_range=20,
    width_shift_range=0.2,
    height_shift_range=0.2,
    zoom_range=0.2,
    horizontal_flip=True,
    fill_mode="nearest",
)

test_datagen = ImageDataGenerator(rescale=1.0 / 255)

train_data = train_datagen.flow_from_directory(
    train_dir, target_size=IMG_SIZE, batch_size=BATCH_SIZE, class_mode="categorical"
)

test_data = test_datagen.flow_from_directory(
    test_dir,
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode="categorical",
    shuffle=False,
)

print(f"\nDataset Info:")
print(f"  Number of classes: {train_data.num_classes}")
print(f"  Classes: {list(train_data.class_indices.keys())}")


with open("class_indices.json", "w") as f:
    json.dump(train_data.class_indices, f, indent=2)

# ===============================
# 3️⃣ Load Pretrained Model (Transfer Learning)
# ===============================

base_model = MobileNetV2(
    weights="imagenet", include_top=False, input_shape=(224, 224, 3)
)

base_model.trainable = False

# ===============================
# 4️⃣ Build Custom Model
# ===============================

model = models.Sequential(
    [
        base_model,
        layers.GlobalAveragePooling2D(),
        layers.Dense(256, activation="relu"),
        layers.Dropout(0.5),
        layers.Dense(128, activation="relu"),
        layers.Dropout(0.3),
        layers.Dense(train_data.num_classes, activation="softmax"),
    ]
)

# ===============================
# 5️⃣ Compile Model
# ===============================

model.compile(
    optimizer=keras.optimizers.Adam(learning_rate=0.001),
    loss="categorical_crossentropy",
    metrics=["accuracy"],
)

print("\nModel compiled successfully!")
print(f"Total parameters: {model.count_params()}")

# ===============================
# 6️⃣ Train Model with Callbacks
# ===============================

print(f"\nTraining model for {EPOCHS} epochs...")

early_stopping = keras.callbacks.EarlyStopping(
    monitor="val_loss", patience=5, restore_best_weights=True
)

history = model.fit(
    train_data,
    epochs=EPOCHS,
    validation_data=test_data,
    callbacks=[early_stopping],
    verbose=1,
)

# ===============================
# 7️⃣ Save Training History
# ===============================

history_dict = {
    "accuracy": [float(x) for x in history.history["accuracy"]],
    "loss": [float(x) for x in history.history["loss"]],
    "val_accuracy": [float(x) for x in history.history["val_accuracy"]],
    "val_loss": [float(x) for x in history.history["val_loss"]],
}

with open(os.path.join(SCRIPT_DIR, "training_history.json"), "w") as f:
    json.dump(history_dict, f, indent=2)

# Plot training history
plt.figure(figsize=(12, 4))

plt.subplot(1, 2, 1)
plt.plot(history.history["accuracy"], label="Training Accuracy")
plt.plot(history.history["val_accuracy"], label="Validation Accuracy")
plt.title("Model Accuracy")
plt.xlabel("Epoch")
plt.ylabel("Accuracy")
plt.legend()
plt.grid(True)

plt.subplot(1, 2, 2)
plt.plot(history.history["loss"], label="Training Loss")
plt.plot(history.history["val_loss"], label="Validation Loss")
plt.title("Model Loss")
plt.xlabel("Epoch")
plt.ylabel("Loss")
plt.legend()
plt.grid(True)

plt.tight_layout()
plt.savefig(os.path.join(SCRIPT_DIR, "training_history.png"), dpi=100)
print("Training history plot saved!")

# ===============================
# 8️⃣ Save Model
# ===============================

model_path = os.path.join(SCRIPT_DIR, "waste_classifier_model.keras")
model.save(model_path)

print(f"\n✅ Model saved successfully to: {model_path}")
print(f"✅ Run 'python evaluation_of_model.py' to evaluate the model")
