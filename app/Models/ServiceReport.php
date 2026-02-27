<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ServiceReport extends Model
{
    use HasFactory;

    protected $table = 'service_reports';

    protected $fillable = [
        'report_no',
        'customer',
        'contact_person',
        'phone',
        'address',
        'brand',
        'model',
        'serial_no',
        'description',
        'start_date',
        'completed_date',
        'problem_description',
        'service_performed',
        'recommendation',
        'nama_teknisi',
        'nama_client',
        'kota',
        'tanggal',
        'divisi',
        'status',
        'user_id',
    ];

    protected $casts = [
        'start_date' => 'date',
        'completed_date' => 'date',
        'tanggal' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Auto load relationships
    protected $with = ['serviceTypes', 'parts'];

    // Relationships
    public function serviceTypes()
    {
        return $this->hasMany(ServiceType::class);
    }

    public function parts()
    {
        return $this->hasMany(ServiceReportPart::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
