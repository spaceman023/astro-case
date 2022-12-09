Cases:
id (primary key)
case_number
case_type
case_status
filed_date
resolved_date

People:
id (primary key)
name
dob
address

CasePeople:
id (primary key)
case_id (foreign key to Cases.id)
person_id (foreign key to People.id)
role (enum: 'witness' or 'defendant')

Charges:
id (primary key)
case_id (foreign key to Cases.id)
charge_name
charge_date
disposition

CaseEvents:
id (primary key)
case_id (foreign key to Cases.id)
event_type (enum: 'hearing' or 'trial' or 'other')
event_date
event_location
notes
