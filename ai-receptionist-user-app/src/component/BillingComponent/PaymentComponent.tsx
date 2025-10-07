import React, { useState } from 'react'
import Button from '../common/Button'
import Card from '../common/Card'
import { FormGroup, FormInput, FormSelect } from '../common/FormElements'
import { FormLabel } from '../common/FormElements'

type Props = {
  card: any[];
  handleCardInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleAddCard: (e: React.FormEvent) => void;
  getCardType: (number: string) => string;
  setDefaultCard: (cardId: string) => void;
  removeCard: (cardId: string) => void;
}

export const PaymentComponent = ({
  card,
  handleCardInputChange,
  handleAddCard,
  getCardType,
  setDefaultCard,
  removeCard
}: Props) => {
  const [showAddCardForm, setShowAddCardForm] = useState(false);
  const [newCard, setNewCard] = useState<any>({
    cardNumber: '',
    cardName: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    isDefault: false
  });

  const getCardIcon = (type: string) => {
    switch (type) {
      case 'visa':
        return (
          <svg className="card-icon" width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="6" fill="#EFF4FF" />
            <path d="M13.3333 20.9998H10.6666L8 11.3332H10.6666L12.3333 17.9998L14 11.3332H16.6666L13.3333 20.9998Z" fill="#1A1F71" />
            <path d="M17.3334 11.3332H19.7334L18.4 20.9998H16L17.3334 11.3332Z" fill="#1A1F71" />
            <path d="M24.1333 11.3332C23.4 11.0665 22.2667 10.6665 21.0667 10.6665C19.0667 10.6665 16.8 11.7332 16.8 13.9998C16.8 15.7332 18.4 16.5332 19.6 17.0665C20.8 17.5998 21.2 17.9998 21.2 18.5332C21.2 19.3332 20.1333 19.7332 19.1333 19.7332C17.9333 19.7332 17.2 19.4665 16.2667 18.9332L15.8667 18.6665L15.4667 20.9998C16.2667 21.3332 17.6 21.6665 19 21.6665C21.2 21.6665 23.3333 20.6665 23.3333 18.1332C23.3333 16.7998 22.4667 15.7332 20.6667 14.9332C19.6 14.3998 18.9333 14.1332 18.9333 13.5998C18.9333 13.0665 19.6 12.5332 20.8 12.5332C21.8 12.5332 22.5333 12.7998 23.0667 13.0665L23.3333 13.1998L23.7333 11.0665L24.1333 11.3332Z" fill="#1A1F71" />
          </svg>
        );
      case 'mastercard':
        return (
          <svg className="card-icon" width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="6" fill="#EFF4FF" />
            <path fillRule="evenodd" clipRule="evenodd" d="M16 21.3335C14.8954 21.3335 14 20.4381 14 19.3335C14 18.229 14.8954 17.3335 16 17.3335C17.1046 17.3335 18 18.229 18 19.3335C18 20.4381 17.1046 21.3335 16 21.3335Z" fill="#EF4123" />
            <path fillRule="evenodd" clipRule="evenodd" d="M13.6667 14.6665C12.5621 14.6665 11.6667 13.771 11.6667 12.6665C11.6667 11.5619 12.5621 10.6665 13.6667 10.6665C14.7712 10.6665 15.6667 11.5619 15.6667 12.6665C15.6667 13.771 14.7712 14.6665 13.6667 14.6665Z" fill="#F99F1B" />
            <path fillRule="evenodd" clipRule="evenodd" d="M18.3333 14.6665C17.2288 14.6665 16.3333 13.771 16.3333 12.6665C16.3333 11.5619 17.2288 10.6665 18.3333 10.6665C19.4379 10.6665 20.3333 11.5619 20.3333 12.6665C20.3333 13.771 19.4379 14.6665 18.3333 14.6665Z" fill="#FFB819" />
          </svg>
        );
      case 'amex':
        return (
          <svg className="card-icon" width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="6" fill="#EFF4FF" />
            <path d="M16 10.6665H11.3333V21.3332H16" stroke="#1071CF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M21.3334 10.6665H16V21.3332H21.3334" stroke="#1071CF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M16 14.6665H18.6667" stroke="#1071CF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M16 17.3335H18.6667" stroke="#1071CF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      case 'discover':
        return (
          <svg className="card-icon" width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="6" fill="#EFF4FF" />
            <path d="M22.6667 16C22.6667 19.6819 19.6819 22.6667 16 22.6667C12.3181 22.6667 9.33334 19.6819 9.33334 16C9.33334 12.3181 12.3181 9.33334 16 9.33334C19.6819 9.33334 22.6667 12.3181 22.6667 16Z" stroke="#F27712" strokeWidth="2" />
            <path d="M13.3333 16.6667L14.6667 18L18 14.6667" stroke="#F27712" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      default:
        return (
          <svg className="card-icon" width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="6" fill="#EFF4FF" />
            <rect x="8" y="10" width="16" height="12" rx="2" stroke="#64748B" strokeWidth="2" />
            <path d="M8 14H24" stroke="#64748B" strokeWidth="2" />
          </svg>
        );
    }
  };
  return (
   <>
     <Card
          title="Payment Methods"
          subtitle="Add and manage your payment options"
        >
          {/* Add new card form */}
          {showAddCardForm && (
            <div style={{ 
              marginBottom: '2rem', 
              padding: '1.5rem', 
              background: 'var(--gray-50)', 
              borderRadius: 'var(--radius-lg)', 
              border: '1px solid var(--gray-200)'
            }}>
              <div style={{ 
                fontWeight: '600', 
                fontSize: '1.125rem', 
                marginBottom: '1.5rem' 
              }}>
                Add New Payment Method
              </div>
              
              <form onSubmit={handleAddCard}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <div style={{ gridColumn: 'span 2' }}>
                    <FormGroup>
                      <FormLabel htmlFor="cardNumber">Card Number</FormLabel>
                      <FormInput
                        id="cardNumber"
                        name="cardNumber"
                        type="text"
                        value={newCard.cardNumber}
                        onChange={handleCardInputChange}
                        placeholder="1234 5678 9012 3456"
                        required
                        maxLength="16"
                      />
                    </FormGroup>
                  </div>
                  
                  <div style={{ gridColumn: 'span 2' }}>
                    <FormGroup>
                      <FormLabel htmlFor="cardName">Name on Card</FormLabel>
                      <FormInput
                        id="cardName"
                        name="cardName"
                        type="text"
                        value={newCard.cardName}
                        onChange={handleCardInputChange}
                        placeholder="John Smith"
                        required
                      />
                    </FormGroup>
                  </div>
                  
                  <div>
                    <FormGroup>
                      <FormLabel htmlFor="expiryMonth">Expiry Month</FormLabel>
                      <FormSelect
                        id="expiryMonth"
                        name="expiryMonth"
                        value={newCard.expiryMonth}
                        onChange={(e) => handleCardInputChange(e as unknown as React.ChangeEvent<HTMLInputElement>)}
                        required
                        options={[
                          { value: '', label: 'Month', disabled: true },
                          { value: '01', label: '01 - January' },
                          { value: '02', label: '02 - February' },
                          { value: '03', label: '03 - March' },
                          { value: '04', label: '04 - April' },
                          { value: '05', label: '05 - May' },
                          { value: '06', label: '06 - June' },
                          { value: '07', label: '07 - July' },
                          { value: '08', label: '08 - August' },
                          { value: '09', label: '09 - September' },
                          { value: '10', label: '10 - October' },
                          { value: '11', label: '11 - November' },
                          { value: '12', label: '12 - December' }
                        ]}
                      />
                    </FormGroup>
                  </div>
                  
                  <div>
                    <FormGroup>
                      <FormLabel htmlFor="expiryYear">Expiry Year</FormLabel>
                      <FormSelect
                        id="expiryYear"
                        name="expiryYear"
                        value={newCard.expiryYear}
                        onChange={(e) => handleCardInputChange(e as unknown as React.ChangeEvent<HTMLInputElement>)}
                        required
                        options={[
                          { value: '', label: 'Year', disabled: true },
                          { value: '2025', label: '2025' },
                          { value: '2026', label: '2026' },
                          { value: '2027', label: '2027' },
                          { value: '2028', label: '2028' },
                          { value: '2029', label: '2029' },
                          { value: '2030', label: '2030' }
                        ]}
                      />
                    </FormGroup>
                  </div>
                  
                  <div>
                    <FormGroup>
                      <FormLabel htmlFor="cvv">CVV</FormLabel>
                      <FormInput
                        id="cvv"
                        name="cvv"
                        type="text"
                        value={newCard.cvv}
                        onChange={handleCardInputChange}
                        placeholder="123"
                        required
                        maxLength="4"
                        style={{ width: '100px' }}
                      />
                    </FormGroup>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        name="isDefault"
                        checked={newCard.isDefault}
                        onChange={handleCardInputChange}
                      />
                      <span style={{ fontSize: '0.875rem' }}>Set as default payment method</span>
                    </label>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <Button 
                    variant="secondary" 
                    type="button"
                    onClick={() => setShowAddCardForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="primary" 
                    type="submit"
                  >
                    Add Card
                  </Button>
                </div>
              </form>
            </div>
          )}
          
          {!showAddCardForm && (
            <div style={{ marginBottom: '1.5rem' }}>
              <Button 
                variant="primary"
                onClick={() => setShowAddCardForm(true)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.5rem' }}>
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Add Payment Method
              </Button>
            </div>
          )}
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {card.map((card: any) => (
              <div 
                key={card.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  background: 'var(--white)',
                  borderRadius: 'var(--radius-lg)',
                  border: `1px solid ${card.isDefault ? 'var(--primary-light)' : 'var(--gray-200)'}`,
                  boxShadow: card.isDefault ? '0 0 0 2px rgba(67, 97, 238, 0.1)' : 'var(--shadow-sm)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {card.isDefault && (
                  <div style={{ 
                    position: 'absolute',
                    top: '0',
                    left: '0',
                    width: '4px',
                    height: '100%',
                    background: 'var(--primary)'
                  }}></div>
                )}
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {getCardIcon(card.type)}
                  
                  <div>
                    <div style={{ 
                      fontSize: '0.9375rem', 
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      {card.type.charAt(0).toUpperCase() + card.type.slice(1)} •••• {card.last4}
                      {card.isDefault && (
                        <span style={{ 
                          fontSize: '0.75rem', 
                          padding: '0.125rem 0.5rem', 
                          background: 'var(--primary-lighter)', 
                          color: 'var(--primary)', 
                          borderRadius: 'var(--radius-full)', 
                          fontWeight: '600' 
                        }}>
                          Default
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--gray-600)' }}>
                      Expires {card.expMonth.toString().padStart(2, '0')}/{card.expYear.toString().slice(2)}
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  {!card.isDefault && (
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={() => setDefaultCard(card.id)}
                    >
                      Set as Default
                    </Button>
                  )}
                  <Button 
                    variant="secondary" 
                    size="sm"
                    style={{ color: 'var(--danger)' }}
                    onClick={() => removeCard(card.id)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                  </Button>
                </div>
              </div>
            ))}
            
            {card.length === 0 && (
              <div style={{ 
                padding: '3rem', 
                textAlign: 'center', 
                background: 'var(--gray-50)', 
                borderRadius: 'var(--radius-lg)', 
                color: 'var(--gray-500)',
                border: '1px dashed var(--gray-300)'
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 1rem', color: 'var(--gray-400)' }}>
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                  <line x1="1" y1="10" x2="23" y2="10"></line>
                </svg>
                <div style={{ marginBottom: '1rem', fontWeight: '500', fontSize: '1.125rem' }}>
                  No payment methods added yet
                </div>
                <div style={{ marginBottom: '1.5rem', fontSize: '0.9375rem' }}>
                  Add a credit card or debit card to manage your subscription
                </div>
                <Button 
                  variant="primary"
                  onClick={() => setShowAddCardForm(true)}
                >
                  Add Payment Method
                </Button>
              </div>
            )}
          </div>
        </Card>
        </>
  )
}

export default PaymentComponent