import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: '[info-donet]', // คงตามของเดิมในโปรเจกต์
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './info-donet.component.html',
})
export class InfoDonetComponent {
  // จำนวนเงินลัด
  presetAmounts = [100, 300, 500, 1000];

  // สถานะจำนวนเงิน
  selectedAmount: number | null = 300;
  customAmount: number | null = null;
  isCustom = false;

  // วิธีชำระ
  paymentMethod: 'promptpay' | 'bank' | 'card' | '' = '';

  // ผู้บริจาค/ใบเสร็จ
  donorName = '';
  donorEmail = '';
  needReceipt = false;

  // สถานะสำเร็จ (ตัวอย่าง)
  donationSuccess = false;

  // คำนวณยอดที่จะจ่ายจริง
  get amountToPay(): number {
    if (this.isCustom && this.customAmount) return Math.max(0, Math.floor(this.customAmount));
    return this.selectedAmount ?? 0;
  }

  selectAmount(a: number) {
    this.isCustom = false;
    this.selectedAmount = a;
    // ถ้าเคยพิมพ์ custom แล้วอยาก reset ก็ทำได้
    // this.customAmount = null;
  }

  selectCustom() {
    this.isCustom = true;
    if (!this.customAmount) {
      this.customAmount = 300;
    }
    this.selectedAmount = null;
  }

  syncCustom() {
    this.isCustom = true;
    if (this.customAmount !== null && this.customAmount < 0) {
      this.customAmount = 0;
    }
  }

  donate() {
    if (this.amountToPay <= 0 || !this.paymentMethod) {
      return;
    }
    // TODO: เรียก API จริงของคุณตรงนี้
    // ตัวอย่างจำลองผลลัพธ์สำเร็จ:
    this.donationSuccess = true;

    // ถ้าต้องการ reset ฟอร์มบางส่วน:
    // this.paymentMethod = '';
    // this.donorName = '';
    // this.donorEmail = '';
    // this.needReceipt = false;
  }
}
