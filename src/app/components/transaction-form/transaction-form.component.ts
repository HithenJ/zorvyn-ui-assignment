import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Transaction } from '../../models/transaction.model';

@Component({
  selector: 'app-transaction-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './transaction-form.component.html',
  styleUrls: ['./transaction-form.component.css']
})
export class TransactionFormComponent implements OnInit, OnChanges {

  @Input() transaction?: Transaction;
  @Input() isOpen: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<Omit<Transaction, 'id'>>();

  transactionForm: FormGroup;

  categories = [
    'Salary', 'Freelance', 'Food', 'Electronics', 'Healthcare',
    'Home', 'Shopping', 'Transportation', 'Entertainment',
    'Education', 'Investment', 'Other'
  ];
  
  isDropdownOpen = false;

  constructor(private fb: FormBuilder) {
    this.transactionForm = this.fb.group({
      description: ['', [Validators.required, Validators.minLength(3)]],
      amount: [0, [Validators.required, Validators.min(0.01)]],
      category: ['Shopping', Validators.required],
      type: ['expense', Validators.required],
      date: [this.getTodayDate(), Validators.required] // ✅ FIXED
    });
  }

  ngOnInit(): void {
    this.updateFormValues();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['transaction'] || (changes['isOpen'] && this.isOpen)) {
      this.updateFormValues();
    }
  }

  // ✅ Get today's date in YYYY-MM-DD (LOCAL, no UTC bug)
  getTodayDate(): string {
    const d = new Date();
    return d.toISOString().split('T')[0];
  }

  private updateFormValues(): void {
    if (this.transaction) {
      const d = new Date(this.transaction.date);

      const dateValue = d.toISOString().split('T')[0]; // only for input display

      this.transactionForm.patchValue({
        description: this.transaction.description,
        amount: this.transaction.amount,
        category: this.transaction.category,
        type: this.transaction.type,
        date: dateValue
      });
    } else {
      this.transactionForm.patchValue({
        description: '',
        amount: 0,
        category: 'Shopping',
        type: 'expense',
        date: this.getTodayDate() // ✅ FIXED
      });
    }
  }

  onSubmit(): void {
    if (this.transactionForm.valid) {
      const formValue = this.transactionForm.value;

      // ✅ CRITICAL FIX: combine selected date + current time (LOCAL)
      const now = new Date();
      const selectedDate = new Date(formValue.date);

      selectedDate.setHours(
        now.getHours(),
        now.getMinutes(),
        now.getSeconds()
      );

      const transactionData: Omit<Transaction, 'id'> = {
        ...formValue,
        date: selectedDate // ❌ NO toISOString()
      };

      this.save.emit(transactionData);
      this.onClose();
    }
  }

  onClose(): void {
    this.isDropdownOpen = false;
    this.close.emit();
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  selectCategory(category: string): void {
    this.transactionForm.patchValue({ category });
    this.isDropdownOpen = false;
  }
}
