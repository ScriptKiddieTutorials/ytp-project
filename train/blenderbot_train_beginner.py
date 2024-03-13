"""2024/02/12
Engage - YTP Project for Team "Brackets"


The purpose of this script is to fine-tune the blenderbot model
to align with our aim of promoting English education through dialogue.
"""

from datasets import Dataset, load_dataset
from transformers import Trainer, TrainingArguments
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM


# Setup model and tokenizer for blenderbot
model = AutoModelForSeq2SeqLM.from_pretrained("facebook/blenderbot-400M-distill")
tokenizer = AutoTokenizer.from_pretrained("facebook/blenderbot-400M-distill")


# Load "daily_dialog" for beginners
conv_ds = load_dataset("daily_dialog")
train_ds, valid_ds, test_ds = conv_ds.values()


# Train, validation and test dataserts
SIZE = 1000 # Dataset size
train_ds = train_ds.select(range(SIZE))
valid_ds = valid_ds.select(range(SIZE))
test_ds = test_ds.select(range(SIZE))


# Tokenization for both training and evaluation datasets
def tokenize_function(data):
    inputs = tokenizer([c[0] for c in data['dialog']], return_tensors='pt', padding=True, truncation=True)
    labels = tokenizer([c[1] for c in data['dialog']], return_tensors='pt', padding=True, truncation=True)

    inputs['labels'] = labels['input_ids']
    return inputs


# Tokenize both training and evaluation datasets using the tokenize_function
train_data = train_ds.map(tokenize_function, batched=True)
eval_data = valid_ds.map(tokenize_function, batched=True)
# test_data = test_ds.map(tokenize_function, batched=True)


# Set up Trainer
output_dir = "scriptkidd196883/ytp-engage-model-beginner"
training_args = TrainingArguments(
    output_dir=output_dir,
    num_train_epochs=5,
    learning_rate=2e-5,
    per_device_train_batch_size=4, # Adjust as needed
    per_device_eval_batch_size=4,  # Same
    weight_decay=0.01,
    evaluation_strategy="epoch",
    logging_steps=len(train_data),
    fp16=False,
)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_data,
    eval_dataset=eval_data,
    tokenizer=tokenizer
)

# Train the model and push to Hugging Face
trainer.train()
trainer.push_to_hub()
