import json, random, time
subjects=['Unable to login','Refund request','Feature request: export','Bug: crash on save','Payment failed','How do I change password?','Error 500 on checkout','Cancel my subscription','Invoice question']
bodies=['I get an error when I try to login with my email.','Please refund my last payment, I did not authorize it.','Would be great to export data to CSV.','App crashes when saving large files.','My card was declined but I was charged.','How can I change my account password?','I see Error 500 when checking out on mobile.','Please cancel my subscription effective immediately.','Why was I invoiced twice this month?']
customers=['cust_01','cust_02','cust_03','cust_04','cust_05']
arr=[]
for i in range(200):
    s=random.choice(subjects)
    b=random.choice(bodies)
    c=random.choice(customers)
    arr.append({'id':f'ticket_{i+1}','subject':s,'body':b,'customer':c,'created':int(time.time())})
open('synthetic_tickets.json','w').write(json.dumps(arr,indent=2))
print('wrote synthetic_tickets.json')
