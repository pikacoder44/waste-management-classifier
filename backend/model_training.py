# type: ignore
import os
import json
from tensorflow import keras
from tensorflow.keras import layers, models
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.preprocessing.image import ImageDataGenerator

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
train_dir = os.path.join(SCRIPT_DIR, "dataset", "train")
test_dir = os.path.join(SCRIPT_DIR, "dataset", "test")

IMG_SIZE = (224, 224)
BATCH_SIZE = 32
EPOCHS = 20

print(f"Dataset paths:")
print(f"  Train: {train_dir}")
print(f"  Test: {test_dir}")

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


with open(os.path.join(SCRIPT_DIR, "utils", "class_indices.json"), "w") as f:
    json.dump(train_data.class_indices, f, indent=2)

base_model = MobileNetV2(
    weights="imagenet", include_top=False, input_shape=(224, 224, 3)
)

base_model.trainable = False

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

model.compile(
    optimizer=keras.optimizers.Adam(learning_rate=0.001),
    loss="categorical_crossentropy",
    metrics=["accuracy"],
)

print("\nModel compiled successfully!")
print(f"Total parameters: {model.count_params()}")

print(f"\nTraining model for {EPOCHS} epochs...")

early_stopping = keras.callbacks.EarlyStopping(
    monitor="val_loss", patience=5, restore_best_weights=True
)

model.fit(
    train_data,
    epochs=EPOCHS,
    validation_data=test_data,
    callbacks=[early_stopping],
    verbose=1,
)

model_path = os.path.join(SCRIPT_DIR, "model", "waste_classifier_model.keras")
model.save(model_path)

print(f"\nModel saved successfully to: {model_path}")
