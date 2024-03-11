<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class DicewayController extends Controller
{
    public function index()
    {
        return view('diceway');
    }
}
