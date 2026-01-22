"""
Fine-tune ResNet50 on Plant Disease Dataset
Downloads PlantVillage dataset and trains the model
"""
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, Dataset
from torchvision import models, transforms
from PIL import Image
import os
import requests
import zipfile
from pathlib import Path
from tqdm import tqdm
import json

class PlantDiseaseDataset(Dataset):
    """Dataset for plant disease images"""
    def __init__(self, root_dir, transform=None):
        self.root_dir = Path(root_dir)
        self.transform = transform
        self.classes = sorted([d.name for d in self.root_dir.iterdir() if d.is_dir()])
        self.class_to_idx = {cls_name: i for i, cls_name in enumerate(self.classes)}
        
        # Get all image paths and labels
        self.samples = []
        for class_name in self.classes:
            class_dir = self.root_dir / class_name
            for img_path in class_dir.glob('*.jpg'):
                self.samples.append((img_path, self.class_to_idx[class_name]))
    
    def __len__(self):
        return len(self.samples)
    
    def __getitem__(self, idx):
        img_path, label = self.samples[idx]
        image = Image.open(img_path).convert('RGB')
        
        if self.transform:
            image = self.transform(image)
        
        return image, label

def download_plantvillage_dataset(data_dir='data/plantvillage'):
    """
    Download PlantVillage dataset
    Note: You need to manually download from Kaggle
    """
    print("=" * 80)
    print("PLANT DISEASE DATASET SETUP")
    print("=" * 80)
    print()
    print("To train on real plant diseases, you need the PlantVillage dataset:")
    print()
    print("Option 1: Download from Kaggle (Recommended)")
    print("  1. Go to: https://www.kaggle.com/datasets/vipoooool/new-plant-diseases-dataset")
    print("  2. Download the dataset (2.2 GB)")
    print("  3. Extract to: backend/ml/data/plantvillage/")
    print("  4. Structure should be: data/plantvillage/train/[disease_folders]/")
    print()
    print("Option 2: Use smaller custom dataset")
    print("  1. Create folders in: backend/ml/data/plantvillage/train/")
    print("  2. Add disease folders like: Healthy, Late_Blight, Powdery_Mildew, etc.")
    print("  3. Add at least 50+ images per disease class")
    print()
    print("Dataset should contain:")
    print("  - Healthy plants")
    print("  - Various disease types (blight, rust, mosaic, etc.)")
    print("  - Multiple plant species (tomato, potato, corn, wheat)")
    print()
    
    data_path = Path(data_dir)
    if not data_path.exists():
        data_path.mkdir(parents=True, exist_ok=True)
        print(f"Created directory: {data_path}")
        print("\nPlease add images to this directory and run again.")
        return False
    
    train_dir = data_path / 'train'
    if not train_dir.exists() or len(list(train_dir.iterdir())) == 0:
        print(f"\n[ERROR] No training data found in {train_dir}")
        print("Please download and extract the dataset first.")
        return False
    
    print(f"\n[OK] Dataset found in {train_dir}")
    classes = [d.name for d in train_dir.iterdir() if d.is_dir()]
    print(f"[OK] Found {len(classes)} disease classes")
    print(f"Classes: {', '.join(classes[:10])}{'...' if len(classes) > 10 else ''}")
    return True

def train_model(data_dir='data/plantvillage', num_epochs=10, batch_size=32):
    """
    Fine-tune ResNet50 on plant disease dataset
    """
    print("\n" + "=" * 80)
    print("TRAINING PLANT DISEASE MODEL")
    print("=" * 80)
    
    # Check dataset
    if not download_plantvillage_dataset(data_dir):
        print("\n[ABORTED] Dataset not ready.")
        return
    
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"\n[DEVICE] Using: {device}")
    
    # Data transforms
    train_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(10),
        transforms.ColorJitter(brightness=0.2, contrast=0.2),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])
    
    # Load dataset
    print("\n[1/5] Loading dataset...")
    train_dataset = PlantDiseaseDataset(
        root_dir=f'{data_dir}/train',
        transform=train_transform
    )
    
    train_loader = DataLoader(
        train_dataset,
        batch_size=batch_size,
        shuffle=True,
        num_workers=0  # Windows compatibility
    )
    
    num_classes = len(train_dataset.classes)
    print(f"[OK] Loaded {len(train_dataset)} images")
    print(f"[OK] Classes: {num_classes}")
    print(f"[OK] Batches per epoch: {len(train_loader)}")
    
    # Load pre-trained ResNet50
    print("\n[2/5] Loading ResNet50 model...")
    model = models.resnet50(weights=models.ResNet50_Weights.IMAGENET1K_V2)
    
    # Replace final layer
    num_features = model.fc.in_features
    model.fc = nn.Linear(num_features, num_classes)
    model = model.to(device)
    
    print(f"[OK] Model loaded with {num_classes} output classes")
    
    # Freeze early layers (faster training)
    print("\n[3/5] Freezing early layers...")
    for param in list(model.parameters())[:-20]:  # Freeze all but last 20 layers
        param.requires_grad = False
    
    trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    print(f"[OK] Trainable parameters: {trainable_params:,}")
    
    # Loss and optimizer
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001)
    scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=3, gamma=0.1)
    
    # Training loop
    print(f"\n[4/5] Training for {num_epochs} epochs...")
    print("=" * 80)
    
    best_accuracy = 0.0
    
    for epoch in range(num_epochs):
        model.train()
        running_loss = 0.0
        correct = 0
        total = 0
        
        progress_bar = tqdm(train_loader, desc=f'Epoch {epoch+1}/{num_epochs}')
        
        for images, labels in progress_bar:
            images, labels = images.to(device), labels.to(device)
            
            # Forward pass
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            
            # Backward pass
            loss.backward()
            optimizer.step()
            
            # Statistics
            running_loss += loss.item()
            _, predicted = outputs.max(1)
            total += labels.size(0)
            correct += predicted.eq(labels).sum().item()
            
            # Update progress bar
            accuracy = 100. * correct / total
            progress_bar.set_postfix({
                'loss': f'{running_loss/len(progress_bar):.3f}',
                'acc': f'{accuracy:.1f}%'
            })
        
        epoch_loss = running_loss / len(train_loader)
        epoch_acc = 100. * correct / total
        
        print(f'\nEpoch {epoch+1}/{num_epochs}:')
        print(f'  Loss: {epoch_loss:.4f}')
        print(f'  Accuracy: {epoch_acc:.2f}%')
        
        # Save best model
        if epoch_acc > best_accuracy:
            best_accuracy = epoch_acc
            torch.save({
                'epoch': epoch,
                'model_state_dict': model.state_dict(),
                'optimizer_state_dict': optimizer.state_dict(),
                'accuracy': epoch_acc,
                'classes': train_dataset.classes,
            }, 'plant_disease_model_best.pth')
            print(f'  [SAVED] Best model (accuracy: {epoch_acc:.2f}%)')
        
        scheduler.step()
    
    # Save final model
    print("\n[5/5] Saving final model...")
    torch.save({
        'model_state_dict': model.state_dict(),
        'classes': train_dataset.classes,
        'accuracy': best_accuracy,
        'num_classes': num_classes
    }, 'plant_disease_model_final.pth')
    
    # Save class mapping
    with open('plant_disease_classes.json', 'w') as f:
        json.dump({
            'classes': train_dataset.classes,
            'num_classes': num_classes,
            'trained_accuracy': best_accuracy
        }, f, indent=2)
    
    print("\n" + "=" * 80)
    print("TRAINING COMPLETED!")
    print("=" * 80)
    print(f"Best Accuracy: {best_accuracy:.2f}%")
    print(f"Model saved to: plant_disease_model_final.pth")
    print(f"Classes saved to: plant_disease_classes.json")
    print("\nTo use this model:")
    print("  1. Update deep_learning_model.py to load 'plant_disease_model_final.pth'")
    print("  2. Update disease_classes to match plant_disease_classes.json")
    print("  3. Restart backend server")
    print("=" * 80)

if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Train Plant Disease Detection Model')
    parser.add_argument('--data-dir', type=str, default='data/plantvillage',
                        help='Path to PlantVillage dataset')
    parser.add_argument('--epochs', type=int, default=10,
                        help='Number of training epochs (default: 10)')
    parser.add_argument('--batch-size', type=int, default=32,
                        help='Batch size (default: 32)')
    
    args = parser.parse_args()
    
    train_model(
        data_dir=args.data_dir,
        num_epochs=args.epochs,
        batch_size=args.batch_size
    )
