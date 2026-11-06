<?php

namespace App\Models\Cpr;

use App\Traits\AccessibleToUser;
use Illuminate\Database\Eloquent\Model;

/** Une variété de munitions (standard, perforante, incendiaire…) et les types de munitions dans lesquels elle existe. */
class CprMunition extends Model
{
    use AccessibleToUser;

    protected $table = 'cpr_munition';
    protected $hidden = ['created_at', 'updated_at'];
    protected $casts = [
        'id' => 'integer',
        'prix' => 'integer',
        'types' => 'array',
        'ordre' => 'integer',
    ];
}
