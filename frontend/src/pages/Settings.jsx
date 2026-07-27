import { useEffect, useState } from "react";
import api from "../services/api";

const emptySettings = {

    platform_name: "",

    platform_email: "",

    platform_phone: "",

    platform_logo: "",

    trial_days: 240,

    default_subscription_plan_id: "",

    default_currency_id: "",

    allow_school_registration: true,

    maintenance_mode: false,

    paystack_enabled: true,

    stripe_enabled: true,

    email_notifications: true,

    sms_notifications: false,

};

export default function Settings() {

    const [loading,setLoading] = useState(false);

    const [message,setMessage] = useState("");

    const [error,setError] = useState("");

    const [settings,setSettings] = useState(emptySettings);

    const [plans,setPlans] = useState([]);

    const [currencies,setCurrencies] = useState([]);

    useEffect(()=>{

        loadEverything();

    },[]);

/* ============================================================
   LOAD EVERYTHING
============================================================ */

async function loadEverything(){

    try{

        setLoading(true);

        await Promise.all([

            loadSettings(),

            loadPlans(),

            loadCurrencies(),

        ]);

    }

    catch(error){

        console.log(error);

        setError("Unable to load system settings.");

    }

    finally{

        setLoading(false);

    }

}

/* ============================================================
   LOAD SYSTEM SETTINGS
============================================================ */

async function loadSettings(){

    const response = await api.get("/system-settings");

    const data = response.data.data ?? response.data;

    setSettings({

        ...emptySettings,

        ...data,

        default_subscription_plan_id:
            data.default_subscription_plan?.id ?? "",

        default_currency_id:
            data.default_currency?.id ?? "",

    });

}

/* ============================================================
   LOAD SUBSCRIPTION PLANS
============================================================ */

async function loadPlans(){

    const response = await api.get("/subscription-plans");

    setPlans(

        response.data.data ??

        response.data ??

        []

    );

}

/* ============================================================
   LOAD CURRENCIES
============================================================ */

async function loadCurrencies(){

    const response = await api.get("/currencies");

    setCurrencies(

        response.data.data ??

        response.data ??

        []

    );

}

/* ============================================================
   SAVE SETTINGS
============================================================ */

async function saveSettings(){

    try{

        setLoading(true);

        setMessage("");

        setError("");

        await api.put(

            "/system-settings",

            settings

        );

        setMessage(

            "Settings updated successfully."

        );

        await loadSettings();

    }

    catch(error){

        console.log(error);

        setError(

            "Unable to save settings."

        );

    }

    finally{

        setLoading(false);

    }

}

return (

<div className="container-fluid py-4">

    <div className="card shadow-sm">

        <div className="card-header d-flex justify-content-between align-items-center">

            <h4 className="mb-0">

                System Settings

            </h4>

            <button

                className="btn btn-primary"

                onClick={saveSettings}

                disabled={loading}

            >

                {

                    loading

                    ?

                    "Saving..."

                    :

                    "Save Settings"

                }

            </button>

        </div>

        <div className="card-body">

            {

                message &&

                <div className="alert alert-success">

                    {message}

                </div>

            }

            {

                error &&

                <div className="alert alert-danger">

                    {error}

                </div>

            }

            <div className="row g-4">

                <div className="col-md-6">

                    <label className="form-label">

                        Platform Name

                    </label>

                    <input

                        className="form-control"

                        value={settings.platform_name}

                        onChange={(e)=>

                            setSettings({

                                ...settings,

                                platform_name:e.target.value

                            })

                        }

                    />

                </div>

                <div className="col-md-6">

                    <label className="form-label">

                        Platform Email

                    </label>

                    <input

                        className="form-control"

                        value={settings.platform_email}

                        onChange={(e)=>

                            setSettings({

                                ...settings,

                                platform_email:e.target.value

                            })

                        }

                    />

                </div>

                <div className="col-md-6">

                    <label className="form-label">

                        Platform Phone

                    </label>

                    <input

                        className="form-control"

                        value={settings.platform_phone}

                        onChange={(e)=>

                            setSettings({

                                ...settings,

                                platform_phone:e.target.value

                            })

                        }

                    />

                </div>

                <div className="col-md-6">

                    <label className="form-label">

                        Platform Logo

                    </label>

                    <input

                        className="form-control"

                        value={settings.platform_logo}

                        onChange={(e)=>

                            setSettings({

                                ...settings,

                                platform_logo:e.target.value

                            })

                        }

                    />

                </div>

                <div className="col-md-4">

                    <label className="form-label">

                        Trial Days

                    </label>

                    <input

                        type="number"

                        className="form-control"

                        value={settings.trial_days}

                        onChange={(e)=>

                            setSettings({

                                ...settings,

                                trial_days:e.target.value

                            })

                        }

                    />

                </div>

                             <div className="col-md-4">

                    <label className="form-label">

                        Default Subscription Plan

                    </label>

                    <select

                        className="form-select"

                        value={settings.default_subscription_plan_id}

                        onChange={(e)=>

                            setSettings({

                                ...settings,

                                default_subscription_plan_id:e.target.value

                            })

                        }

                    >

                        <option value="">

                            Select Plan

                        </option>

                        {

                            plans.map((plan)=>(

                                <option

                                    key={plan.id}

                                    value={plan.id}

                                >

                                    {plan.name}

                                </option>

                            ))

                        }

                    </select>

                </div>

                <div className="col-md-4">

                    <label className="form-label">

                        Default Currency

                    </label>

                    <select

                        className="form-select"

                        value={settings.default_currency_id}

                        onChange={(e)=>

                            setSettings({

                                ...settings,

                                default_currency_id:e.target.value

                            })

                        }

                    >

                        <option value="">

                            Select Currency

                        </option>

                        {

                            currencies.map((currency)=>(

                                <option

                                    key={currency.id}

                                    value={currency.id}

                                >

                                    {currency.name} ({currency.code})

                                </option>

                            ))

                        }

                    </select>

                </div>

                <hr className="my-4"/>

                <div className="col-12">

                    <h5>

                        Platform Options

                    </h5>

                </div>

                <div className="col-md-6">

                    <div className="form-check form-switch">

                        <input

                            className="form-check-input"

                            type="checkbox"

                            checked={settings.allow_school_registration}

                            onChange={(e)=>

                                setSettings({

                                    ...settings,

                                    allow_school_registration:e.target.checked

                                })

                            }

                        />

                        <label className="form-check-label">

                            Allow School Registration

                        </label>

                    </div>

                </div>

                <div className="col-md-6">

                    <div className="form-check form-switch">

                        <input

                            className="form-check-input"

                            type="checkbox"

                            checked={settings.maintenance_mode}

                            onChange={(e)=>

                                setSettings({

                                    ...settings,

                                    maintenance_mode:e.target.checked

                                })

                            }

                        />

                        <label className="form-check-label">

                            Maintenance Mode

                        </label>

                    </div>

                </div>

                         <div className="col-md-6">

                    <div className="form-check form-switch">

                        <input

                            className="form-check-input"

                            type="checkbox"

                            checked={settings.paystack_enabled}

                            onChange={(e)=>

                                setSettings({

                                    ...settings,

                                    paystack_enabled:e.target.checked

                                })

                            }

                        />

                        <label className="form-check-label">

                            Enable Paystack

                        </label>

                    </div>

                </div>

                <div className="col-md-6">

                    <div className="form-check form-switch">

                        <input

                            className="form-check-input"

                            type="checkbox"

                            checked={settings.stripe_enabled}

                            onChange={(e)=>

                                setSettings({

                                    ...settings,

                                    stripe_enabled:e.target.checked

                                })

                            }

                        />

                        <label className="form-check-label">

                            Enable Stripe

                        </label>

                    </div>

                </div>

                <div className="col-md-6">

                    <div className="form-check form-switch">

                        <input

                            className="form-check-input"

                            type="checkbox"

                            checked={settings.email_notifications}

                            onChange={(e)=>

                                setSettings({

                                    ...settings,

                                    email_notifications:e.target.checked

                                })

                            }

                        />

                        <label className="form-check-label">

                            Email Notifications

                        </label>

                    </div>

                </div>

                <div className="col-md-6">

                    <div className="form-check form-switch">

                        <input

                            className="form-check-input"

                            type="checkbox"

                            checked={settings.sms_notifications}

                            onChange={(e)=>

                                setSettings({

                                    ...settings,

                                    sms_notifications:e.target.checked

                                })

                            }

                        />

                        <label className="form-check-label">

                            SMS Notifications

                        </label>

                    </div>

                </div>

            </div>

        </div>

    </div>

</div>

);

}
