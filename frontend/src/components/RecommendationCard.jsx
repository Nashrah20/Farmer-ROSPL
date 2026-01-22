import React from 'react';

const RecommendationCard = ({ prediction, onApprove, approving }) => {
  if (!prediction) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
        Click "Get Recommendation" to receive ML-powered farming advice
      </div>
    );
  }

  const { predictions, explanation, model_used, predicted_at, input_summary } = prediction;

  return (
    <div className="bg-gradient-to-br from-primary-50 to-green-50 rounded-lg shadow-lg p-6 border-2 border-primary-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800">🤖 AI Recommendation</h3>
        <span className="text-xs px-3 py-1 bg-primary-600 text-white rounded-full">
          {model_used}
        </span>
      </div>

      {/* Predictions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-xs text-gray-600 mb-1">Irrigation</p>
          <p className="text-2xl font-bold text-blue-600">
            {predictions.irrigation_liters.toFixed(0)}
            <span className="text-sm ml-1">L</span>
          </p>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-xs text-gray-600 mb-1">Nitrogen (N)</p>
          <p className="text-2xl font-bold text-green-600">
            {predictions.fertilizer_N_g.toFixed(0)}
            <span className="text-sm ml-1">g</span>
          </p>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-xs text-gray-600 mb-1">Phosphorus (P)</p>
          <p className="text-2xl font-bold text-yellow-600">
            {predictions.fertilizer_P_g.toFixed(0)}
            <span className="text-sm ml-1">g</span>
          </p>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-xs text-gray-600 mb-1">Potassium (K)</p>
          <p className="text-2xl font-bold text-purple-600">
            {predictions.fertilizer_K_g.toFixed(0)}
            <span className="text-sm ml-1">g</span>
          </p>
        </div>
      </div>

      {/* Explanation */}
      <div className="bg-white rounded-lg p-4 mb-4 border-l-4 border-primary-500">
        <p className="text-sm font-semibold text-gray-700 mb-2">💡 Explanation</p>
        <p className="text-sm text-gray-600 leading-relaxed">{explanation}</p>
      </div>

      {/* Input Summary */}
      <div className="bg-white rounded-lg p-4 mb-4">
        <p className="text-xs font-semibold text-gray-700 mb-2">Current Conditions</p>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <span className="text-gray-600">Moisture:</span>{' '}
            <span className="font-semibold">{input_summary.soil_moisture}%</span>
          </div>
          <div>
            <span className="text-gray-600">Temp:</span>{' '}
            <span className="font-semibold">{input_summary.temperature}°C</span>
          </div>
          <div>
            <span className="text-gray-600">Rainfall:</span>{' '}
            <span className="font-semibold">{input_summary.rainfall}mm</span>
          </div>
          <div>
            <span className="text-gray-600">N:</span>{' '}
            <span className="font-semibold">{input_summary.nitrogen}</span>
          </div>
          <div>
            <span className="text-gray-600">P:</span>{' '}
            <span className="font-semibold">{input_summary.phosphorus}</span>
          </div>
          <div>
            <span className="text-gray-600">K:</span>{' '}
            <span className="font-semibold">{input_summary.potassium}</span>
          </div>
        </div>
      </div>

      {/* Approve Button */}
      <button
        onClick={onApprove}
        disabled={approving}
        className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {approving ? (
          <>
            <span className="loading mr-2"></span>
            Approving...
          </>
        ) : (
          <>
            ✓ Approve Action
          </>
        )}
      </button>

      <p className="text-xs text-gray-500 text-center mt-2">
        Predicted at: {new Date(predicted_at).toLocaleString()}
      </p>
    </div>
  );
};

export default RecommendationCard;
