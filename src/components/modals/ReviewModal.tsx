import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Star, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeName: string;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ isOpen, onClose, employeeName }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('Please provide a rating');
      return;
    }
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.success(`Performance review submitted for ${employeeName}`);
    setIsSaving(false);
    onClose();
    setRating(0);
    setComment('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] rounded-[2rem]">
        <DialogHeader>
          <DialogTitle className="text-xl font-black">Performance Review</DialogTitle>
          <p className="text-sm text-slate-500">Evaluating: <span className="font-bold text-slate-900">{employeeName}</span></p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-3">
            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Performance Rating</Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="transition-transform active:scale-90"
                >
                  <Star 
                    className={`w-8 h-8 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} 
                  />
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest" htmlFor="comment">Detailed Evaluation</Label>
            <Textarea 
              id="comment" 
              required 
              value={comment} 
              onChange={(e) => setComment(e.target.value)} 
              placeholder="Provide constructive feedback on employee performance..."
              className="min-h-[120px] rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving} className="rounded-xl font-bold">Cancel</Button>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold" disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Review'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};