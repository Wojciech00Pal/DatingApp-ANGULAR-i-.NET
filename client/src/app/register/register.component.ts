import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { AccountService } from '../_services/account.service';
import {ToastrService} from 'ngx-toastr';
import { AbstractControl, UntypedFormBuilder, FormControl, UntypedFormGroup, ValidatorFn, Validators } from '@angular/forms';
import { Router } from '@angular/router';


@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  
  
  @Output() cancelRegister = new EventEmitter();
  registerForm: UntypedFormGroup;
  maxDate:Date;
  validationErrors:string[] | undefined;

  constructor(private accountService:AccountService,private toastr:ToastrService,
    private fb:UntypedFormBuilder, private router:Router) { }

  ngOnInit(): void {
    this.initializeForm();
    this.maxDate = new Date();
    this.maxDate.setFullYear(this.maxDate.getFullYear()-18);
  }

  initializeForm(){
    this.registerForm=this.fb.group({
      gender:['male'],
      username:['',Validators.required],
      knownAs:['',Validators.required],
      dateOfBirth:['',Validators.required],
      city:['',Validators.required],
      country:['',Validators.required],
      password:['',[Validators.required,Validators.minLength(4),Validators.maxLength(8)]],
      confirmPassword:['',[Validators.required, this.matchValues('password')]]
    })
    this.registerForm.controls.password.valueChanges.subscribe(()=>
    {
      this.registerForm.controls.confirmPassword.updateValueAndValidity();
    })
  }

  matchValues(matchTo:string):ValidatorFn
  {
   return (control:AbstractControl)=>{
    return control?.value===control?.parent?.controls[matchTo].value
     ? null : {isMatching: true}
   } 
  }


  register()
  {
    const dob = this.getDateOnly(this.registerForm.controls['dateOfBirth'].value);
    const values={...this.registerForm.value,dateOfBirth:dob};
   
    this.accountService.register(values).subscribe({
      next:()=>{
        this.router.navigateByUrl('/members')
      },
      error: error=>{
        this.validationErrors=error;
      }
    })
  }

  cancel()
  {
    this.cancelRegister.emit(false);
  }

  private getDateOnly(dob:string | undefined){
    if(!dob) return;
    let theDob = new Date(dob);
    return new Date(theDob.setMinutes(theDob.getMinutes()-theDob.getTimezoneOffset()))
    .toISOString().slice(0,10);

  }
}
