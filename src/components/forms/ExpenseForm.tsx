
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ExpenseFormProps {
  open: boolean;
  onClose: () => void;
  expense?: any;
  onSave: (expense: any) => void;
}

export function ExpenseForm({ open, onClose, expense, onSave }: ExpenseFormProps) {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: '',
    customCategory: '',
    date: new Date(),
    paidBy: '',
    receiptNumber: '',
    status: 'en attente'
  });
  const [showCustomCategory, setShowCustomCategory] = useState(false);

  const predefinedCategories = [
    'Salaires', 'Charges', 'Pédagogie', 'Maintenance', 
    'Fournitures', 'Transport', 'Formation', 'Assurance'
  ];

  useEffect(() => {
    if (expense) {
      setFormData({
        description: expense.description || '',
        amount: expense.amount?.toString() || '',
        category: expense.category || '',
        customCategory: '',
        date: expense.date ? new Date(expense.date) : new Date(),
        paidBy: expense.paidBy || '',
        receiptNumber: expense.receiptNumber || '',
        status: expense.status || 'en attente'
      });
    } else {
      setFormData({
        description: '',
        amount: '',
        category: '',
        customCategory: '',
        date: new Date(),
        paidBy: '',
        receiptNumber: `DEP-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`,
        status: 'en attente'
      });
    }
  }, [expense, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const expenseData = {
      id: expense?.id || Date.now(),
      description: formData.description,
      amount: parseFloat(formData.amount),
      category: formData.category === 'custom' ? formData.customCategory : formData.category,
      date: format(formData.date, 'yyyy-MM-dd'),
      paidBy: formData.paidBy,
      receiptNumber: formData.receiptNumber,
      status: formData.status
    };

    onSave(expenseData);
    onClose();
  };

  const handleCategoryChange = (value: string) => {
    if (value === 'custom') {
      setShowCustomCategory(true);
      setFormData(prev => ({ ...prev, category: 'custom' }));
    } else {
      setShowCustomCategory(false);
      setFormData(prev => ({ ...prev, category: value, customCategory: '' }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-gradient-to-br from-white to-[#7B68EE]/5 border-[#7B68EE]/20">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-[#7B68EE] to-[#4B9CD3] bg-clip-text text-transparent">
            {expense ? 'Modifier la dépense' : 'Nouvelle dépense'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="description" className="text-[#7B68EE] font-medium">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description de la dépense..."
                required
                className="border-[#7B68EE]/30 focus:ring-[#7B68EE]/50 focus:border-[#7B68EE] bg-white/90"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount" className="text-[#7B68EE] font-medium">Montant (€) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0.00"
                required
                className="border-[#7B68EE]/30 focus:ring-[#7B68EE]/50 focus:border-[#7B68EE] bg-white/90"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[#7B68EE] font-medium">Catégorie *</Label>
              <Select value={formData.category} onValueChange={handleCategoryChange} required>
                <SelectTrigger className="border-[#7B68EE]/30 focus:ring-[#7B68EE]/50 focus:border-[#7B68EE] bg-white/90">
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {predefinedCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                  <SelectItem value="custom">
                    <div className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Autre (saisir)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {showCustomCategory && (
              <div className="space-y-2">
                <Label htmlFor="customCategory" className="text-[#7B68EE] font-medium">Nouvelle catégorie *</Label>
                <Input
                  id="customCategory"
                  value={formData.customCategory}
                  onChange={(e) => setFormData(prev => ({ ...prev, customCategory: e.target.value }))}
                  placeholder="Nom de la nouvelle catégorie"
                  required
                  className="border-[#7B68EE]/30 focus:ring-[#7B68EE]/50 focus:border-[#7B68EE] bg-white/90"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-[#7B68EE] font-medium">Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal border-[#7B68EE]/30 hover:bg-[#7B68EE]/10",
                      !formData.date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-[#7B68EE]" />
                    {formData.date ? format(formData.date, "PPP", { locale: fr }) : "Sélectionner une date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.date}
                    onSelect={(date) => date && setFormData(prev => ({ ...prev, date }))}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paidBy" className="text-[#7B68EE] font-medium">Responsable/Service *</Label>
              <Select value={formData.paidBy} onValueChange={(value) => setFormData(prev => ({ ...prev, paidBy: value }))} required>
                <SelectTrigger className="border-[#7B68EE]/30 focus:ring-[#7B68EE]/50 focus:border-[#7B68EE] bg-white/90">
                  <SelectValue placeholder="Qui a effectué le paiement ?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Direction">Direction</SelectItem>
                  <SelectItem value="Comptabilité">Comptabilité</SelectItem>
                  <SelectItem value="RH">Ressources Humaines</SelectItem>
                  <SelectItem value="Service technique">Service technique</SelectItem>
                  <SelectItem value="Pédagogie">Service pédagogique</SelectItem>
                  <SelectItem value="Administration">Administration</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="receiptNumber" className="text-[#7B68EE] font-medium">Numéro de reçu</Label>
              <Input
                id="receiptNumber"
                value={formData.receiptNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, receiptNumber: e.target.value }))}
                placeholder="DEP-2025-XXX"
                className="border-[#7B68EE]/30 focus:ring-[#7B68EE]/50 focus:border-[#7B68EE] bg-white/90"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[#7B68EE] font-medium">Statut</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                <SelectTrigger className="border-[#7B68EE]/30 focus:ring-[#7B68EE]/50 focus:border-[#7B68EE] bg-white/90">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en attente">En attente</SelectItem>
                  <SelectItem value="validé">Validé</SelectItem>
                  <SelectItem value="rejeté">Rejeté</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#7B68EE]/20">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="border-[#7B68EE]/30 text-[#7B68EE] hover:bg-[#7B68EE]/10"
            >
              Annuler
            </Button>
            <Button 
              type="submit"
              className="bg-gradient-to-r from-[#7B68EE] to-[#4B9CD3] hover:from-[#6B58DE] to-[#3B8CC3] shadow-lg"
            >
              {expense ? 'Mettre à jour' : 'Ajouter la dépense'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
