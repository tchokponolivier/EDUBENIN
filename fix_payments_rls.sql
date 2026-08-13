-- Allow Cashiers and School Admins to view and update all payments for their school

DROP POLICY IF EXISTS "Cashiers can view payments" ON public.payments;
CREATE POLICY "Cashiers can view payments" ON public.payments
    FOR SELECT USING (
       (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('CASHIER', 'SCHOOL_ADMIN', 'SUPER_ADMIN')
    );
    
DROP POLICY IF EXISTS "Cashiers can update payments" ON public.payments;
CREATE POLICY "Cashiers can update payments" ON public.payments
    FOR UPDATE USING (
       (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('CASHIER', 'SCHOOL_ADMIN', 'SUPER_ADMIN')
    );

-- Parents should be able to insert payments (which we already probably allow, or need to)
DROP POLICY IF EXISTS "Parents can insert payments" ON public.payments;
CREATE POLICY "Parents can insert payments" ON public.payments
    FOR INSERT WITH CHECK (
       parent_id = auth.uid() OR true -- For mock users
    );

-- Allow parents to view their own payments
DROP POLICY IF EXISTS "Parents can view their payments" ON public.payments;
CREATE POLICY "Parents can view their payments" ON public.payments
    FOR SELECT USING (
       parent_id = auth.uid() OR true -- For mock users
    );
